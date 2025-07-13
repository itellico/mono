import * as React from 'react';

interface WelcomeEmailProps {
  name: string;
}

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <div>
    <h1>Welcome, {name}!</h1>
    <p>Thank you for signing up.</p>
  </div>
);
