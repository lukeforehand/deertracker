### build

```bash
docker build -t gcr.io/deertracker/detector -f ./gcp/detector/Dockerfile .
```

### run locally

```bash
docker run -it \
  -p 8080:8080 \
  -v $(pwd)/gcloud-config.json:/tmp/keys/gcloud-config.json \
  -e GOOGLE_APPLICATION_CREDENTIALS=/tmp/keys/gcloud-config.json \
  -e PORT=8080 \
  -e BUCKET=deertracker.io \
  gcr.io/deertracker/detector
```

### deploy

```bash
docker build -t gcr.io/deertracker/detector -f ./gcp/detector/Dockerfile . && \
docker push gcr.io/deertracker/detector && \
gcloud run deploy detector --image gcr.io/deertracker/detector --platform managed
```
