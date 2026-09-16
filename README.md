# Monoplate

싱글 테넌트 SaaS를 빠르게 시작하기 위한 TypeScript 모노레포 템플릿입니다. 하나의 API 배포 단위를 유지하면서 도메인별 의존성을 분리하는 hexagonal modular monolith 구조를 사용합니다.

## 기술 구성

| 영역 | 기술 |
|---|---|
| API | Node.js 24, Hono, OpenAPI, Pino |
| 데이터베이스 | PostgreSQL 17, Drizzle ORM |
| 인증 | 단일 테넌트 `admin`/`member`, JWT, 회전형 refresh session |
| Mobile | Expo, Expo Router, NativeWind, TanStack Query |
| Admin | React, Vite, TanStack Query |
| Landing | Astro |
| 모노레포 | pnpm workspace, Turborepo |
| 품질·운영 | Vitest, ESLint, CodeQL, Trivy, OpenTelemetry, 선택적 Sentry |

## CLI로 템플릿 사용하기

> 현재 `monoplate-cli` 패키지는 이 저장소에 포함되어 있거나 npm에 배포된 상태가 아닙니다. 아직 `npx monoplate ...` 같은 명령을 사용하면 안 됩니다. 현재 지원하는 방식은 버전 태그를 checkout한 뒤 저장소 안의 initializer를 실행하는 것입니다.

```bash
git clone --branch v0.1.0 git@github.com:WeKIKO/monoplate.git my-saas
cd my-saas
git switch -c main
pnpm run init -- \
  --yes \
  --name my-saas \
  --namespace my-company \
  --displayName "My SaaS" \
  --iosBundleIdentifier com.mycompany.mysaas \
  --androidPackage com.mycompany.mysaas
pnpm install --lockfile-only
```

향후 별도 `monoplate-cli`는 다음 파일을 계약으로 사용해야 합니다.

- [템플릿 메타데이터](./.monoplate/template.json): 템플릿·CLI 최소 버전과 runtime 요구사항
- [initializer](./tooling/scripts/init-workspace.mjs): namespace, 앱 이름, bundle ID 등의 실제 치환
- [.template-ignore](./.template-ignore): 새 프로젝트에 복사하지 않을 파일
- 생성되는 `.monoplate/project.json`: 초기화 결과와 선택 기능
- 생성되는 `.monoplate/generated.json`: 생성 파일 provenance와 편집 가능 범위

### Initializer 옵션

| 옵션 | 예시 | 설명 |
|---|---|---|
| `--name` | `my-saas` | 프로젝트와 데이터베이스 기본 이름 |
| `--namespace` | `my-company` | package scope. 결과는 `@my-company/*` |
| `--displayName` | `"My SaaS"` | 사용자에게 표시할 이름 |
| `--iosBundleIdentifier` | `com.example.app` | iOS bundle identifier |
| `--androidPackage` | `com.example.app` | Android application ID |
| `--yes` | — | 질문 없이 실행 |
| `--with-admin` | `false` | Admin 선택 상태 기록 |
| `--with-sentry` | `false` | Sentry 선택 상태 기록 |
| `--with-auth` | `false` | 인증 선택 상태 기록 |
| `--with-database` | `false` | DB 선택 상태 기록 |
| `--with-eas` | `false` | EAS 선택 상태 기록 |
| `--with-observability` | `false` | 관측 가능성 선택 상태 기록 |

선택 옵션은 현재 `.monoplate/project.json`에 기록되는 CLI 계약이며 디렉터리나 dependency를 물리적으로 제거하지는 않습니다. `auth=true`는 `database=true`를 요구합니다.

동일한 인자로 initializer를 다시 실행하면 안전한 no-op입니다. 다른 인자로 재실행하면 identity drift 방지를 위해 실패하므로 값을 바꾸려면 깨끗한 템플릿에서 다시 시작하세요. 처리 중 실패하면 이미 변경된 파일은 rollback됩니다.

## 5분 로컬 시작

Node.js 24+, pnpm 11.24.0, Docker Compose가 필요합니다.

```bash
cp .env.example .env
pnpm install --frozen-lockfile
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm auth:bootstrap
pnpm check
pnpm dev
```

`auth:bootstrap` 전에 `.env`의 `AUTH_JWT_SECRET`, `AUTH_BOOTSTRAP_EMAIL`, `AUTH_BOOTSTRAP_PASSWORD`를 실제 값으로 바꿔야 합니다. JWT secret은 최소 32자, bootstrap password는 최소 12자입니다.

- API: `http://localhost:3000`
- OpenAPI: `http://localhost:3000/openapi.json`
- Admin: `http://localhost:5173`
- Landing: `http://localhost:4321`
- PostgreSQL: `localhost:5432`

## 저장소 구조

```text
apps/
├── api/                 # API composition root와 HTTP/infrastructure adapter
├── admin/               # 운영자용 React SPA
├── landing/             # Astro 마케팅 사이트
└── mobile/              # Expo 애플리케이션
domains/
├── auth/                # 인증 domain/application 계층
└── <domain>/            # generator가 만드는 bounded context
packages/
├── config/              # 환경변수 계약
├── contracts/           # API Zod schema와 생성 client type
├── database/            # Drizzle client, schema와 migration
├── postgres-adapters/   # domain port를 구현하는 Drizzle outbound adapter
├── design-tokens/       # 디자인 토큰 원본과 생성 결과
├── integrations/        # email/storage/payment/job port와 adapter
├── logger/              # logger port
└── ui/                  # 공통 web UI와 frontend 규약
tooling/scripts/         # initializer, generator, 검증 스크립트
docs/                    # ADR, runbook, 상세 운영 문서
```

의존성 방향:

```text
HTTP/UI adapter → application use case → domain model
                         ↓
                  repository/service port
                         ↑
              Drizzle·SDK 등 outbound adapter
```

- `domains/*`는 Hono, Drizzle, React, Expo, Pino, Zod, 환경변수를 import하지 않습니다.
- 도메인은 다른 도메인의 내부 파일을 deep import하지 않습니다.
- `apps/*`가 composition root이며 실제 adapter를 선택합니다.
- `packages/*`와 `domains/*`는 TypeScript source-first package입니다.
- 서버 전용 package를 Admin, Landing, Mobile에서 import하면 architecture check가 실패합니다.

### API가 domain과 adapter를 조립하는 방식

`apps/api`는 composition root입니다. HTTP 요청을 domain use case에 연결하고, 실행 환경에서 사용할 outbound adapter를 선택해 주입합니다. API는 Drizzle API나 schema를 직접 사용하지 않고 `@monoplate/postgres-adapters`가 공개하는 구현만 조립합니다.

```text
HTTP request
    ↓
apps/api (Hono route와 composition root)
    ↓
application use case
    ↓
domains/auth의 AuthRepository port
    ↑ implements
packages/postgres-adapters의 DrizzleAuthRepository
    ↓
packages/database → PostgreSQL
```

예를 들어 API 시작점은 database connection과 adapter를 생성한 뒤 domain port를 요구하는 `AuthService`에 주입합니다.

```ts
import { createDatabaseConnection } from "@monoplate/database";
import { DrizzleAuthRepository } from "@monoplate/postgres-adapters/auth";

const connection = createDatabaseConnection(databaseUrl);
const repository = new DrizzleAuthRepository(connection.db);
const auth = new AuthService(repository, tokenService, refreshTtlDays);
```

`AuthService`와 domain use case가 의존하는 것은 `AuthRepository` port입니다. 따라서 테스트에서는 같은 port를 구현한 fake 또는 memory repository를 주입할 수 있습니다. Domain은 어떤 구현이 선택됐는지 알지 못합니다.

의존 방향은 항상 바깥에서 안쪽으로 향합니다.

```text
apps/api → postgres-adapters → database/Drizzle
    │              │
    └──────────────┴────→ domains/*의 port

domains/* ─X→ apps/api, postgres-adapters, database, Drizzle
```

- `domains/*`에는 runtime `dependencies`, `peerDependencies`, `optionalDependencies`를 선언하지 않습니다.
- domain production source는 상대 경로 또는 package에 등록된 `#<domain>/*` 내부 namespace로 연결된 순수 TypeScript 코드만 import할 수 있습니다.
- Hono, Drizzle, PostgreSQL SDK, logger 구현 등 외부 기술은 HTTP 또는 outbound adapter에 둡니다.
- 구체 구현 선택은 `apps/api`에서만 수행합니다. Adapter에서 domain으로 역참조하거나 domain에서 adapter를 import하지 않습니다.
- package 내부의 상위 디렉터리 참조에는 `../`를 사용하지 않고 `#api/*`, `#database/*`, `#<domain>/*` 같은 등록된 내부 namespace를 사용합니다. 같은 디렉터리의 `./` import는 허용합니다.
- 이 규칙은 `pnpm check:architecture`가 검사합니다.

## 도메인 생성

도메인 이름은 lowercase kebab-case여야 합니다. 변경 사항이 없는 별도 브랜치에서 생성하는 것을 권장합니다.

```bash
pnpm generate:domain -- \
  --name catalog \
  --entity product \
  --description "Product catalog"
```

명령이 생성하는 항목:

- `domains/catalog/domain.json`
- 순수 `Product` model
- `ProductRepository` application port
- list use case와 단위 테스트
- `packages/contracts/src/catalog/model.ts`
- `packages/database/src/schema/catalog.ts`
- API용 memory repository와 별도 package의 Drizzle repository
- API module composition과 workspace dependency
- public export, database schema index, lockfile 갱신

dependency 설치 없이 생성하려면 다음 옵션을 사용하고 나중에 lockfile을 갱신합니다.

```bash
pnpm generate:domain -- --name catalog --entity product --skip-install=true
pnpm install --lockfile-only
```

이미 존재하는 도메인은 덮어쓰지 않고 실패합니다. 목록은 다음처럼 확인합니다.

```bash
pnpm domains
pnpm domains -- --list
pnpm domains -- --json
```

## Repository port와 adapter 추가

별도 `generate:repository` 명령은 없습니다. `generate:domain`이 기본 CRUD repository port와 memory·Drizzle adapter를 함께 만듭니다.

```text
domains/catalog/src/application/ports/catalog-repository.ts
apps/api/src/modules/catalog/infrastructure/in-memory-catalog-repository.ts
packages/postgres-adapters/src/catalog.ts
packages/database/src/schema/catalog.ts
```

repository를 확장하는 순서:

1. `application/ports/*-repository.ts`에 프레임워크 독립적인 메서드를 추가합니다.
2. application use case가 해당 port만 사용하도록 작성합니다.
3. memory adapter와 단위 테스트를 먼저 수정합니다.
4. Drizzle adapter와 schema를 구현합니다.
5. migration을 생성하고 SQL을 검토합니다.

```bash
pnpm db:generate
pnpm db:migrations:check
pnpm db:migrate
pnpm check
```

domain에 Drizzle row type이나 SQL 오류를 노출하지 마세요. transaction은 repository adapter 또는 application composition 경계에서 처리합니다.

## API route 생성

도메인을 먼저 만든 뒤 route를 생성합니다.

```bash
pnpm generate:route -- --domain catalog --name list-products --method get
pnpm generate:route -- --domain catalog --name create-product --method post
pnpm generate:route -- --domain catalog --name update-product --method patch
pnpm generate:route -- --domain catalog --name delete-product --method delete
```

지원 method는 `get`, `post`, `put`, `patch`, `delete`입니다. 기본 경로는 GET/POST의 경우 `/api/v1/<domain>`, PUT/PATCH/DELETE는 `/api/v1/<domain>/{id}`입니다. 경로를 직접 지정할 수도 있습니다.

```bash
pnpm generate:route -- \
  --domain catalog \
  --name publish-product \
  --method post \
  --path /api/v1/catalog/{id}/publish
```

route generator는 use case, Zod contract, Hono OpenAPI adapter, 단위 테스트, route contract test와 export를 생성합니다. 기존 파일은 덮어쓰지 않습니다. 생성 직후에는 다음을 실행하세요.

```bash
pnpm api:openapi:generate
pnpm api:client:generate
pnpm check
```

## 주요 명령어

### 개발과 검증

| 명령 | 설명 |
|---|---|
| `pnpm dev` | 전체 개발 서버 실행 |
| `pnpm api:dev` | API watch mode |
| `pnpm admin:dev` | Admin 개발 서버 |
| `pnpm landing:dev` | Landing 개발 서버 |
| `pnpm mobile:start` | Expo dev client 시작 |
| `pnpm mobile:ios` | iOS native 실행 |
| `pnpm mobile:android` | Android native 실행 |
| `pnpm check` | env, architecture, dependency, migration, contract, lint, typecheck, test, build, Expo doctor 전체 gate |
| `pnpm deps:check` | package manifest의 미사용·누락 dependency 검사 |
| `pnpm security:check` | secret scan과 High/Critical dependency audit |
| `pnpm mobile:doctor` | Expo 설정과 dependency 검증 |

### API와 계약

| 명령 | 설명 |
|---|---|
| `pnpm generate:domain` | bounded context와 repository 기본 구조 생성 |
| `pnpm generate:route` | use case, contract, OpenAPI route, 테스트 생성 |
| `pnpm domains` | domain 목록 출력 |
| `pnpm api:openapi:generate` | OpenAPI 문서 갱신 |
| `pnpm api:client:generate` | OpenAPI와 client type 갱신 |
| `pnpm api:contract:check` | OpenAPI/client drift 확인 |

### PostgreSQL과 Drizzle

| 명령 | 설명 |
|---|---|
| `pnpm db:up` | PostgreSQL container 시작 |
| `pnpm db:generate` | Drizzle migration 생성 |
| `pnpm db:migrations:check` | migration journal·snapshot·SQL 안전성 확인 |
| `pnpm db:migrate` | migration 적용 |
| `pnpm db:seed` | 개발 seed 적용 |
| `pnpm db:studio` | Drizzle Studio 실행 |
| `pnpm db:test:reset` | `_test` 데이터베이스 초기화 |
| `pnpm db:backup` | `BACKUP_FILE`로 백업 |
| `pnpm db:restore:verify` | `_test` DB에 백업 복원 검증 |

### Docker, EAS, 배포

| 명령 | 설명 |
|---|---|
| `pnpm docker:build` | API production image build |
| `pnpm docker:up` | PostgreSQL migration 후 API 시작 |
| `pnpm docker:down` | Compose 종료. volume은 유지 |
| `pnpm docker:smoke` | image readiness와 graceful shutdown 검증 |
| `pnpm mobile:eas:setup` | Expo project 연결 |
| `pnpm mobile:build:preview` | EAS preview build |
| `pnpm mobile:build:production` | EAS production build |
| `pnpm mobile:update:preview` | preview OTA update |
| `pnpm mobile:update:production` | production OTA update |
| `pnpm mobile:submit:ios` | iOS 제출 |
| `pnpm mobile:submit:android` | Android 제출 |

## 주의사항

1. **초기화는 한 번만 실행하세요.** 동일 인자는 no-op이지만 다른 identity로 재실행하면 실패합니다.
2. **generator 실행 전 커밋하세요.** generator는 여러 package와 index를 수정하며 initializer와 달리 전체 rollback을 제공하지 않습니다.
3. **migration SQL을 검토하세요.** destructive DDL, lock 범위와 backfill 전략을 확인한 후 적용합니다.
4. **`db:push`는 로컬 개발용입니다.** 공유·production 환경에서는 versioned migration을 사용합니다.
5. **`.env`를 커밋하지 마세요.** `VITE_*`, `EXPO_PUBLIC_*` 값은 client bundle에 노출되므로 secret을 넣지 않습니다.
6. **모바일 localhost를 구분하세요.** Android emulator에서는 `10.0.2.2`로 변환됩니다. 실기기는 `EXPO_PUBLIC_DEV_HOST`에 개발 PC의 LAN IP를 지정합니다.
7. **인증은 싱글 테넌트입니다.** tenant-scoped query가 아니라 `admin`/`member` 권한 모델을 확장합니다.
8. **선택 기능 옵션은 dependency를 제거하지 않습니다.** 현재는 manifest에 선택 상태를 기록하는 계약입니다.
9. **EAS secret이 필요합니다.** CI에서는 `EXPO_TOKEN`, `EAS_PROJECT_ID`, Sentry 사용 시 `SENTRY_AUTH_TOKEN`을 설정합니다.
10. **생성 파일을 직접 수정하지 마세요.** OpenAPI client와 design token 결과는 generator로 갱신합니다.

## 생성 파일과 편집 파일

직접 편집하지 않는 파일:

- `apps/api/openapi.json`
- `packages/contracts/src/generated/api.ts`
- `packages/design-tokens/generated/*`

일반적으로 직접 편집하는 파일:

- `domains/*/src/**`
- `apps/*/src/**`
- `packages/database/src/schema/**`
- `.env.example`
- `docs/**`

## 상세 문서

- [문서 인덱스](./docs/README.md)
- [5분 Quick Start](./docs/quick-start.md)
- [환경변수 전체 표](./docs/environment.md)
- [아키텍처](./docs/architecture.md)
- [개발·생성 예제](./docs/development-guide.md)
- [API 운영 규약](./docs/api-operations.md)
- [DB 운영 규약](./docs/database-operations.md)
- [관측 가능성](./docs/observability.md)
- [외부 서비스 adapter](./docs/integrations.md)
- [배포 Runbook](./docs/runbooks/deployment.md)
- [장애 대응 Runbook](./docs/runbooks/incident-response.md)
- [Troubleshooting](./docs/troubleshooting.md)
- [템플릿 migration](./docs/migrations.md)
- [기여 규약](./CONTRIBUTING.md)
- [보안 정책](./SECURITY.md)

## 라이선스

MIT License입니다. 자세한 템플릿 사용 범위는 [template license 안내](./docs/template-license.md)를 참고하세요.
