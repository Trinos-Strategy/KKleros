# KKleros

**한국형 탈중앙화 분쟁해결 플랫폼** — Kleros 기반 온체인 중재·조정 프로토콜을 한국 법제와 ADR(대체적 분쟁해결) 실무에 맞춰 재설계하는 오픈소스 프로젝트입니다.

> ⚠️ 현재 repo는 초기 스캐폴딩 단계이며, 컨트랙트·테스트·CI 파이프라인을 함께 다듬어 줄 기여자(Contributors) 및 공동 구축자(Collaborators)를 찾고 있습니다.

---

## 비전 (Vision)

- **한국 법제 친화적 온체인 ADR**: 중재법·민사조정법 맥락을 고려한 분쟁해결 흐름 구현
- **Kleros 코어 재활용**: 검증된 배심(jury) 메커니즘을 유지하면서 한국형 UX/거버넌스 도입
- **상호운용성**: Axelar GMP 등 크로스체인 메시징으로 외부 에스크로·체인과 연계
- **법률전문가 + 개발자 협업**: 변호사·중재인과 스마트컨트랙트 개발자가 함께 설계

## 기술 스택 (Tech Stack)

- **Solidity** `^0.8.20` (optimizer + viaIR)
- **Hardhat** (TypeScript config)
- **OpenZeppelin Contracts** 5.x
- **Axelar GMP SDK Solidity**
- **Ethers v6** / Chai / Mocha

## 프로젝트 구조

```
contracts/      스마트컨트랙트 (Kleros 코어, EscrowBridge, Governor 등)
scripts/        배포·운영 스크립트
test/           Hardhat + Chai 테스트
hardhat.config.ts
```

## 빠른 시작 (Quick Start)

```bash
# 1) Node 20+ 권장
npm ci

# 2) 컴파일 (viaIR 활성화됨)
npx hardhat compile

# 3) 테스트
npx hardhat test
```

`.env.example`을 복사해 `.env`를 생성하고 필요한 키(RPC URL, 배포 계정 등)를 채워주세요. **실제 비밀값은 절대 커밋하지 마세요.**

## 기여 방법 (Contributing)

1. **Issue 먼저 열기**: 버그·아이디어는 [Issues](../../issues)에서 논의 후 작업 착수
2. **Fork & Branch**: `feat/<topic>`, `fix/<topic>`, `docs/<topic>` 형태 권장
3. **PR 규칙**
   - `main` 브랜치는 보호되어 있으며 PR을 통해서만 병합됩니다
   - 로컬에서 `npx hardhat compile` + `npx hardhat test` 통과 후 PR 생성
   - **CI/테스트 실패 상태의 PR은 병합하지 않습니다** (프로젝트 규칙)
4. **커밋 메시지**: [Conventional Commits](https://www.conventionalcommits.org/) 권장
   예) `feat(escrow): add dispute timeout`, `fix(hardhat): enable viaIR`

### 어떤 기여를 찾고 있나요?

- 🧑‍⚖️ **법률 도메인 모델링**: 한국 중재/조정 절차의 온체인 추상화
- 🛠️ **Solidity 엔지니어링**: Kleros 코어 포팅, 가스 최적화, 보안 리뷰
- 🧪 **테스트 엔지니어링**: 커버리지 확대, 프로퍼티 기반 테스트, fuzzing
- 🔐 **보안**: static analysis(Slither), 감사 체크리스트
- 🌐 **i18n/UX**: 한국어·영어 문서화, 프런트엔드 연동
- 📝 **문서화**: 아키텍처 다이어그램, 튜토리얼

## 보안 정책

- 취약점 제보는 **Public Issue로 올리지 마시고** repo 관리자에게 개별 연락 바랍니다
- Dependabot 알림 및 `.github/dependabot.yml` 기반 보안 업데이트 자동화 적용

## 논의 (Discussions)

설계·거버넌스·법률 이슈 등 열린 토론은 [Discussions](../../discussions) 탭을 이용해 주세요.

## 라이선스

MIT License — 자세한 내용은 [LICENSE](./LICENSE)를 참조하세요.

## 연락처

- Maintainer: **CassianK** (Trinos-Strategy)
- 협업·파트너십 문의는 Issue 또는 Discussions로 남겨주세요.
