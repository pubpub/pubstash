```sh
docker build -t kf-press . && docker run -it --init -p 8080:8080 kf-press
```

Make a POST request to `localhost:8080/convert?format=pdf` where the request body is HTML to convert to a PDF.
