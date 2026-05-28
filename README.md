## Sitemap 검증

`npm run build` 전에 `public/sitemap.xml`을 정적 파일로 재생성합니다. 생성 과정에서 단일 `<urlset>` 구조, URL prefix, percent-encoding 여부를 함께 검증합니다.

로컬 빌드 후:

```bash
npm run build
test -f dist/sitemap.xml
```

배포 후:

```bash
curl -I https://pengejeen.github.io/blog/sitemap.xml
curl -L https://pengejeen.github.io/blog/sitemap.xml | head -n 20
```

기대 결과:

- HTTP status는 `200`.
- `content-type`은 `application/xml`, `text/xml`, 또는 GitHub Pages에서 정적 XML로 처리 가능한 타입.
- 본문 첫 줄은 XML 선언.
- 본문에 `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` 존재.
- 본문에 `<!DOCTYPE html>` 또는 `<html>`이 나오면 실패.
