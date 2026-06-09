package com.zidio.nexushr.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    // Yeh secret key kam se kam 32 characters ki honi chahiye HS256 algorithm ke liye
    private static final String SECRET_STRING = "NexusHRSecretKeyForBtechProject2026Secure";

    // String ko secure Key object mein convert kar rahe hain
    private final Key key = Keys.hmacShaKeyFor(SECRET_STRING.getBytes());

    // Token ki validity: 10 Ghante (1000 ms * 60 sec * 60 min * 10 hrs)
    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 10;

    // 1. Naya Token Banane ka method
    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // 2. Token se Username nikalne ka method
    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    // 3. Token valid hai ya expire ho gaya, yeh check karne ka method
    public boolean isTokenValid(String token) {
        try {
            Claims claims = getClaims(token);
            // Agar expiration date aaj ki date se aage ki hai, toh token valid hai
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            // Agar token galat hai ya expire ho gaya hai, toh false return karo
            return false;
        }
    }

    // Helper method: Token ke andar ka data (Claims) padhne ke liye
    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}