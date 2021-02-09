FROM python:3.8-slim

# Allow statements and log messages to immediately appear in the Knative logs
ENV PYTHONUNBUFFERED True

# Copy local code to the container image.
ENV APP_HOME /app
WORKDIR $APP_HOME

COPY gcp/api/requirements.txt ./
RUN pip install -r requirements.txt

COPY deertracker ./deertracker
COPY config.yaml ./

ENV PYTHONPATH=$APP_HOME

RUN echo $PYTHONPATH

# For environments with multiple CPU cores, increase the number of workers
# to be equal to the cores available.
CMD exec gunicorn --bind :$PORT --workers 4 --threads 1 --timeout 0 deertracker.server:app
