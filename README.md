## Getting Started

## Environment Variables

Required environment variables:

- `STORAGE_PROVIDER` – One of `AWS-S3`, ...

## Storage Providers

### AWS-S3

```ts
STORAGE_PROVIDER=AWS-S3
\AWS_S3_ACCESS_KEY_ID=foo
\AWS_S3_SECRET_ACCESS_KEY=bar
\AWS_S3_REGION=us-east-2
\AWS_S3_BUCKET=assets
\npm start
```

Required environment variables:

- `AWS_S3_ACCESS_KEY_ID` — AWS access key ID
- `AWS_S3_SECRET_ACCESS_KEY` — AWS secret access key
- `AWS_S3_REGION` — AWS region
- `AWS_S3_BUCKET` — S3 bucket name

Optional environment variables:

- `AWS_S3_ASSET_PROXY` — (default: `"https://s3.amazonaws.com/{AWS_S3_BUCKET}"`) override the default URL returned by `POST /convert`

### Local

```ts
npm i
npm start
```

### Docker

```sh
docker build -t kf-press . && docker run -it --init -p 8080:8080 kf-press
```

Make a POST request to `localhost:8080/convert?format=pdf` where the request body is HTML to convert to a PDF.
