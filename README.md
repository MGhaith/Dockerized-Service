# Dockerized Service
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

## Deployment
### Prerequisites

- [GitHub account](https://github.com/)
- [AWS account](https://console.aws.amazon.com)
- SSH key pair generated.

### Setup
#### 1. Clone the project's GitHub repository.

Clone the repository:
   ```bash
   git clone https://github.com/MGhaith/Dockerized-Service.git
   cd Dockerized-Service
   ```

#### 2. Create a Github Repository and Add Secrets
You need this repository to store the project code, trigger the deployment workflow, and store secrets.

1. Create a new repository on [GitHub](https://github.com) for the project.
2. Generate an SSH key pair, if you don't one already.
   ```bash
   ssh-keygen -t rsa -P "" -f ~/.ssh/id_rsa
   ```
3. Create a new secret in the repository settings (Settings > Secrets and variables > Actions > New repository secret).
    - Docker Hub secrets:
        - `DOCKERHUB_USERNAME` — Docker Hub username (or registry user)
        - `DOCKERHUB_TOKEN` — Docker Hub access token (or password)
        - `IMAGE_NAME` — e.g. yourdockerhubusername/dockerized-service
    - SSH secrets:
        - `SSH_PRIVATE_KEY` — Your private SSH key (contents of `~/.ssh/id_rsa`)
        - `SSH_PUBLIC_KEY` — Your public SSH key (contents of `~/.ssh/id_rsa.pub`)
    - .env variables:
        - `SECRET_MESSAGE`: secret text returned on `/secret`
        - `APP_USERNAME`: username for Basic Auth
        - `APP_PASSWORD`: password for Basic Auth
        - `APP_PORT` — port exposed on the server (optional; default 80 or 3000)

#### 3. Create S3 bucket and DynamoDB table for Terraform state
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Navigate to the S3 service and create a new S3 bucket.
    - Bucket name: `dockerized-service-terraform-state-<Your AWS Account ID>` (Replace `<Your AWS Account ID>` with your AWS Account ID)
    - Region: `us-east-1`
    - Enable versioning
    - Enable public access block
    - Create bucket
3. Navigate to the S3 service and create a new DynamoDB table for state locking
    - Table name: `dockerized-service-terraform-locks`
    - Partition key: `LockID` (String)
    - Create table
4. update `terraform\backend.tf` with your bucket name and DynamoDB table name.
    ``` hcl
    terraform {
      required_version = ">= 1.13.0"
  
      backend "s3" {
        bucket         = "dockerized-service-terraform-state-<Your AWS Account ID>" # Change this
        key            = "global/terraform.tfstate"                     
        region         = "us-east-1"                                    
        dynamodb_table = "dockerized-service-terraform-locks" # And this 
        encrypt        = true                                           
      }
    }
    ```

#### 4. Create IAM Role for OIDC
1. Log in to the [AWS Management Console](https://console.aws.amazon.com/).
2. Navigate to the IAM service.
3. Create a new `Web identity` role
    - Trusted entity type: `Web identity`
    - Identity provider: `token.actions.githubusercontent.com`
    - Audience: `sts.amazonaws.com`
    - GitHub organization: `Your Github Username` or `Your Github Organization`
    - GitHub repository: `Your repository name`
4. In the new role you created add the following inline policy:
    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "EC2FullAccess",
                "Effect": "Allow",
                "Action": "ec2:*",
                "Resource": "*"
            },
            {
                "Sid": "STSGetCallerIdentity",
                "Effect": "Allow",
                "Action": "sts:GetCallerIdentity",
                "Resource": "*"
            },
            {
                "Sid": "TerraformS3Backend",
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    "<Your S3 Bucket Name ARN>",
                    "<Your S3 Bucket Name ARN>/*"
                ]
            },
            {
                "Sid": "TerraformDynamoDBLock",
                "Effect": "Allow",
                "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:UpdateItem"
                ],
                "Resource": "<Your DynamoDB Table ARN>"
            }
        ]
    }
    ```
    > **Note**: Replace `<Your S3 Bucket Name ARN>` and `<Your DynamoDB Table ARN>` with your State Bucket ARN and DynamoDB Table ARN created for Terraform remote state (`./terraform/backend.tf`).

5. Copy the Role ARN, we will need it later.

#### 5. Update CI/CD Workflow file.
1. In `.github\workflows\deploy_service.yml`, change the **role-to-assume** value to your role ARN for both the `terraform` and `cleanup` jobs.
    ``` yml
    - name: Configure AWS credentials via OIDC (Terraform)
      uses: aws-actions/configure-aws-credentials@v4
      with:
        role-to-assume: arn:aws:iam::<Account-ID>:role/<Role-Name> # Change this to your role ARN
        aws-region: us-east-1
    ```
#### 6. Push changes to trigger deployment.
1. Commit and push your changes to the `main` branch of the repository you created.
    ```
    git add .
    git commit -m "Deploy Node.js service"
    git push origin main
    ```
2. Check the Actions tab in your repository to monitor the deployment progress.

## Verification
1. Once the deployment is complete, check the Actions tab in your repository to verify that the deployment job has passed.
2. Access the deployed service using the public IP outputted by **Terraform** or the **AWS EC2 Console** with the port (e.g., `http://<public-ip>:<port>`). You should see the “Hello, world!” message.
3. Try accessing the protected `/secret` endpoint using the Basic Auth credentials you set **GitHub Secrets**. You should receive the `SECRET_MESSAGE` value.

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

## GitHub Actions Workflow

The CI/CD pipeline is defined in `.github/workflows/deploy_service.yml` and orchestrates the full build–push–deploy cycle:

1. **Terraform** – spins up an EC2 instance and outputs its public IP.  
2. **Build & Push** – builds the Docker image, tags it with the commit SHA and `latest`, then pushes to Docker Hub.  
3. **Deploy** – SSHs into the new EC2 instance, uploads the `.env` file, pulls the fresh image and starts the container.  
4. **Cleanup** – if any previous job fails, the EC2 instance is automatically destroyed to avoid orphaned resources.

## License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/MGhaith/Dockerized-Service/blob/main/LICENSE) file for details.