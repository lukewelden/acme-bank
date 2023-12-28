# acme-bank
This repo has been created to demonstrate and document the off-platform project associated with the 
_Common Attacks on Web Applications_ unit of Codecademy's Backend Engineer Career Path. 

This challenge project displays knowledge of the following tools and technologies
- Protecting a Node.js app from Cross site scripting
- Protecting a Node.js app from SQL Injection 
- Protecting a Node.js app from insecure Javascript. 

## Brief 
Welcome to Acme Bank! Acme Bank is a small credit union that provides assistance with deposits, loans, and a wide array of other financial services.

While the skeleton of their web app has been completed, there are certain vulnerabilities that were overlooked.

In this off-platform project, you will secure the application by:

- Protecting it against Cross-Site Scripting (XSS) Attacks by using helmet, securing cookies, validating and normalizing data with express-validator, and implementing alternative methods to prevent DOM-Based XSS attacks.
- Preventing SQL injection attacks by using prepared statements as well as validating input.
- Preventing Cross-Site Request Forgery (CSRF) attacks by implementing csurf middleware and updating certain view pages to secure any cross-site request vulnerabilities.

> NOTE: To see the starter code be sure to checkout the starter-code branch! 

## Actions 
- [x] Required helmet to secure http headers
- [x] Secured cookies by adding configuration to the session object
- [x] Sanitised and validated user input on the public forum 
- 