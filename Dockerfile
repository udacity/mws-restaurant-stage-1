FROM python:3.7-alpine
RUN mkdir /app
WORKDIR /app
EXPOSE 8000
CMD ["python", "-m", "http.server", "8000"]