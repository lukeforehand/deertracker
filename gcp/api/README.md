### build

```bash
docker build -t gcr.io/deertracker/api -f ./gcp/api/Dockerfile .
```

### run locally

```bash
docker run -it \
  -p 8080:8080 \
  -v $(pwd)/gcloud-config.json:/tmp/keys/gcloud-config.json \
  -e GOOGLE_APPLICATION_CREDENTIALS=/tmp/keys/gcloud-config.json \
  -e PORT=8080 \
  -e BASIC_AUTH_USERNAME=api \
  -e BASIC_AUTH_PASSWORD=xxxxxxxx \
  -e BUCKET=deertracker.io \
  gcr.io/deertracker/api
```

### deploy

```bash
docker push gcr.io/deertracker/api
gcloud run deploy --image gcr.io/deertracker/api --platform managed
```
