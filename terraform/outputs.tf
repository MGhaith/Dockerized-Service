output "server_ip" {
  value       = aws_instance.dockerized-service.public_ip
  description = "The public IP of the Node.js server"
}
