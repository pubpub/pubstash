## Getting Started

### Environment Variables

- `AWS_S3_ACCESS_KEY_ID`
- `AWS_S3_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `ASSET_PROXY_HOST`

### Local

```ts
npm i
deno run main.ts
```

### Docker

```sh
docker build -t kf-press . && docker run -it --init -p 8080:8080 kf-press
```

Make a POST request to `localhost:8080/convert?format=pdf` where the request body is HTML to convert to a PDF.
