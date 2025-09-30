terraform {
  required_version = ">= 1.13.0"

  backend "s3" {
    bucket         = "dockerized-service-terraform-state-<Your AWS Account ID>"        # S3 bucket name (create once manually)
    key            = "global/terraform.tfstate"                                        # Path inside the bucket
    region         = "us-east-1"                                                       # Best Region for you
    dynamodb_table = "dockerized-service-terraform-locks"                              # DynamoDB table for state locking
    encrypt        = true                                                              # Encrypt state at rest
  }
}
