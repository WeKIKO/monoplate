# @xierra/monoplate-cli

Monoplate TypeScript monorepo 보일러플레이트를 새 프로젝트로 생성하는 CLI입니다.

Scaffolding CLI for the public [Monoplate](https://github.com/WeKIKO/monoplate) template.

## 사용법 | Usage

```bash
npx @xierra/monoplate-cli@latest new happy
```

대화형으로 프로젝트 identity, namespace, bundle identifier와 테마 색상을 설정합니다. The interactive flow configures identity, namespace, bundle identifiers, and theme colors.

```bash
npx @xierra/monoplate-cli@latest new happy --namespace=happy --display-name="Happy" --ios-bundle-identifier="com.happy.app" --android-package="com.happy.app" --primary-color="#FF6B35" --secondary-color="#2563EB" --tertiary-color="#10B981" --error-color="#DC2626"
```

도움말은 다음 명령으로 확인할 수 있습니다. Show all options with:

```bash
npx @xierra/monoplate-cli@latest --help
```

## 동작 | How it works

1. 공개 저장소를 HTTPS로 `git clone --depth 1` 합니다. Clone the public repository over HTTPS.
2. 템플릿 Git history를 제거하고 새 Git repository를 초기화합니다. Initialize a fresh Git repository.
3. `.template-ignore`의 CLI 전용 파일을 제거합니다. Remove template-only paths.
4. `pnpm install --frozen-lockfile`으로 의존성을 설치합니다. Install dependencies.
5. clone된 template의 initializer로 identity와 theme을 적용합니다. Run the template initializer.
6. 변경된 workspace namespace에 맞춰 dependency link를 갱신합니다. Refresh workspace dependency links for the generated namespace.
7. 실패하면 기본적으로 생성 디렉터리를 삭제합니다. `--keep-on-failure`로 유지할 수 있습니다.

npm package에는 CLI만 포함되고, Monoplate 전체 소스는 실행 시 공개 GitHub에서 받습니다. The npm package contains only the CLI; the full template is fetched at runtime.

## 테마 설정 | Theme configuration

`primary`는 기본 seed이고 나머지는 선택 입력입니다. `secondary`, `tertiary`, `error`를 생략하면 primary에서 자동 생성됩니다.

`primary` is the base seed. Optional secondary, tertiary, and error seeds are derived from primary when omitted.

| 옵션 / Option | 기본값 / Default | 설명 / Description |
| --- | --- | --- |
| `--primary-color` | `#4F46E5` | primary Material 3 seed |
| `--secondary-color` | primary에서 생성 / derived | secondary seed |
| `--tertiary-color` | primary에서 생성 / derived | tertiary seed |
| `--error-color` | primary에서 생성 / derived | error seed |

RGB 채널이 같은 primary seed(예: `#000000`, `#777777`)는 자동으로 Material 3 monochrome scheme을 사용합니다. 라이트 테마의 primary는 입력한 seed를 그대로 유지하고, 다크 테마는 읽기 쉬운 대비색을 생성합니다.

Achromatic primary seeds automatically use the Material 3 monochrome scheme, preserving the exact seed as the light-theme primary while generating an accessible dark-theme counterpart.

light/dark scheme 모두에 `on*`, `*Container`, surface, outline, inverse semantic token이 생성됩니다. Both schemes include on-colors, containers, surfaces, outlines, and inverse tokens.

## 옵션 | Options

| 옵션 / Option | 설명 / Description |
| --- | --- |
| `--namespace=<name>` | workspace namespace without `@` |
| `--display-name=<name>` | 앱 표시 이름 / application display name |
| `--primary-color=<#RRGGBB>` | primary seed |
| `--secondary-color=<#RRGGBB>` | optional secondary seed |
| `--tertiary-color=<#RRGGBB>` | optional tertiary seed |
| `--error-color=<#RRGGBB>` | optional error seed |
| `--ios-bundle-identifier=<id>` | iOS bundle identifier |
| `--android-package=<id>` | Android application ID |
| `--ios-bundle-name=<id>` | `--ios-bundle-identifier` alias |
| `--android-package-name=<id>` | `--android-package` alias |
| `--template=<git-url>` | template URL |
| `--tag=<tag-or-branch>` | Git tag or branch |
| `--skip-install` | install 생략; `--skip-init` 필요 / requires `--skip-init` |
| `--skip-init` | initializer 실행 생략 / skip initializer |
| `--yes` | 기본값으로 비대화형 실행 / use defaults |
| `--keep-on-failure` | 실패 시 결과 유지 / keep output after failure |
| `--help` | 도움말 / show help |

특정 template release를 고정할 수 있습니다. Pin a template release with:

```bash
npx @xierra/monoplate-cli@latest new happy --tag=v0.2.0
```

## 요구사항 | Requirements

- Node.js 24 이상 / Node.js 24 or newer
- Git
- pnpm 11 이상 / pnpm 11 or newer
- GitHub와 npm에 접근 가능한 네트워크 / network access

`--skip-install --skip-init`을 함께 사용하면 pnpm 없이 template만 받을 수 있습니다. Use both flags to clone without pnpm.

## 로컬 개발 | Local development

```bash
git clone https://github.com/WeKIKO/monoplate.git
cd monoplate
pnpm install
pnpm --filter @xierra/monoplate-cli test
pnpm --filter @xierra/monoplate-cli lint
node packages/monoplate-cli/bin/monoplate-cli.mjs --help
```

패키지에 포함되는 파일은 다음으로 확인합니다. Inspect npm contents with:

```bash
cd packages/monoplate-cli
npm pack --dry-run
```

## 배포 | Publishing

```bash
cd packages/monoplate-cli
npm login
npm publish --access public
```

또는 `publish-cli.yml` workflow에서 `cli-v*` tag를 push할 수 있습니다. Alternatively, configure npm trusted publishing or `NPM_TOKEN`, then push a `cli-v*` tag.

```bash
git tag cli-v0.1.0
git push origin cli-v0.1.0
```

## 라이선스 | License

MIT
