# Dockerized Service (WIP)
Deploy a Dockerized Node.js Service using GitHub Actions

## Project Structure
```
├── .github
│   └── workflows
│       └── deploy.yml      # Github Actions CI/CD workflow   
├── Dockerfile              # Dockerfile for the Node.js service
├── .dockerignore           # Docker ignore file
├── node_service            # Node.js application code
└── terraform               # Terraform configuration files    
```

### Infrastructure Destruction
To destroy the infrastructure created by this project, follow these steps:
1. Navigate to the project directory.
2. Ensure you have Terraform installed and configured with AWS credentials.
3. Run the following command to destroy the resources:
    ```
    cd terraform
    terraform destroy
    ```
3. Enter you public key content from `~/.ssh/id_rsa.pub` and confirm the destruction when prompted.

## Node.js Service
The Node.js service is an Express app with two endpoints:

- `GET /` – returns “Hello, world!”
- `GET /secret` – protected by Basic Auth; returns the value of `SECRET_MESSAGE`

Environment variables required:
- `PORT`: (optional, defaults to 3000)
- `BASIC_AUTH_USER`: username for the protected route
- `BASIC_AUTH_PASS`: password for the protected route
- `SECRET_MESSAGE`: secret text returned on `/secret`

### Local testing:
1. Copy the `.env.example` file to `.env` and update the values.
    ```bash
    cp .env.example .env
    ```
2. Pick a testing method:
    - using Node:
        ```bash
        cd node_service
        npm install
        node service.js
        ```
    - Using Docker:
        For this you need docker installed on your machine.
        1. Build the Docker image:
            ```bash
            docker build -t dockerized-service:latest .
            ``` 
        2. Run the Docker container:
            ```bash
            docker run -p 3000:3000 -e PORT=3000 -e BASIC_AUTH_USER=user -e BASIC_AUTH_PASS=pass -e SECRET_MESSAGE=secret dockerized-service:latest
            ```

## License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/MGhaith/Dockerized-Service/blob/main/LICENSE) file for details.