FROM python:3.8-slim

ENV DETECTOR_VERSION "md_v4.1.0.pb"
ENV CLASSIFIER_VERSION "dt-0570"

# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED True

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME

COPY gcp/detector/requirements.txt ./
RUN pip install -r requirements.txt

COPY .data/models/$DETECTOR_VERSION ./detector.pb

RUN mkdir ./classifier
COPY .data/models/$CLASSIFIER_VERSION/ ./classifier/

COPY deertracker ./deertracker
COPY config.yaml ./

ENV PYTHONPATH=$APP_HOME

RUN echo $PYTHONPATH

# For environments with multiple CPU cores, increase the number of workers
# to be equal to the cores available.
CMD exec gunicorn --bind :$PORT --workers 1 --threads 1 --timeout 0 deertracker.model:app
