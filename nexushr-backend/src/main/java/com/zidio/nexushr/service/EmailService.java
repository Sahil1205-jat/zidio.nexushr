package com.zidio.nexushr.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${nexushr.brevo.api-key:}")
    private String brevoApiKey;

    public void sendEmail(String toEmail, String subject, String body) {
        // If Brevo API Key is present, use Brevo HTTP REST API (foolproof, bypasses SMTP locks)
        if (brevoApiKey != null && !brevoApiKey.trim().isEmpty()) {
            System.out.println("ℹ️ Attempting to send email via Brevo REST API...");
            try {
                HttpClient client = HttpClient.newHttpClient();
                
                // Format the JSON payload securely
                String escapedBody = body.replace("\\", "\\\\")
                                         .replace("\"", "\\\"")
                                         .replace("\n", "\\n")
                                         .replace("\r", "");
                
                String escapedSubject = subject.replace("\\", "\\\\")
                                             .replace("\"", "\\\"");

                String json = """
                    {
                      "sender": {"name": "NexusHR", "email": "syncwork0@gmail.com"},
                      "to": [{"email": "%s"}],
                      "subject": "%s",
                      "textContent": "%s"
                    }
                    """.formatted(toEmail, escapedSubject, escapedBody);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                        .header("accept", "application/json")
                        .header("api-key", brevoApiKey.trim())
                        .header("content-type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(json))
                        .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    System.out.println("✅ Success: Email successfully sent via Brevo HTTP API to " + toEmail);
                    return;
                } else {
                    System.err.println("❌ Brevo API returned error (Status " + response.statusCode() + "): " + response.body());
                    // Fall through to SMTP if Brevo fails
                }
            } catch (Exception e) {
                System.err.println("❌ Exception during Brevo REST API email send: " + e.getMessage());
                // Fall through to SMTP
            }
        }

        // Fallback: SMTP JavaMailSender
        if (mailSender == null) {
            System.err.println("❌ SMTP mailSender is not initialized and Brevo key is missing.");
            throw new RuntimeException("No email provider configured. Please set BREVO_API_KEY environment variable.");
        }

        System.out.println("ℹ️ Falling back to SMTP...");
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("syncwork0@gmail.com");
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
            System.out.println("✅ Success: Email successfully sent via SMTP to " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Error sending email via SMTP: " + e.getMessage());
            throw new RuntimeException("Failed to send email via both Brevo and SMTP", e);
        }
    }
}