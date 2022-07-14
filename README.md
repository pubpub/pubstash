## Getting Started

### Environment Variables

Required environment variables:

- `STORAGE_PROVIDER` — One of `AWS-S3`, ...

Optional environment variables:

- `ACCESS_TOKEN` — a simple token to authenticate consumers. Must be incldued in an `Authorization` header to the `/convert` endpoint if specified, otherwise the server will respond with a 401: Unauthorized. **Placeholder until proper auth is implemented.**
- `CONVERT_BODY_LIMIT` — (default: 50mb) Integer expressing an upper limit in bytes of request body for the `/convert` endpoint
- `SENTRY_DSN` — Sentry.io data source name

### Storage Providers

#### AWS-S3

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

### Local Dev

Create a `.env` file containing environment variables required by your desired storage provider, then run:

```ts
npm i
npm start
```

### Docker

Create a `.env` file containing environment variables required by your desired storage provider, then run:

```sh
docker build -t pubstash .
docker run --env-file .env -it --init -p 8080:8080 pubstash
```

## Usage

Make a POST request to `localhost:8080/convert?format=pdf` where the request body is HTML to convert to a PDF.
