# Setting Up Twilio OTP with Supabase

Follow these steps to configure Twilio OTP authentication in your Supabase project:

## Step 1: Create a Twilio Account

1. Go to [Twilio](https://www.twilio.com/) and sign up for an account if you don't already have one
2. Verify your account (you may need to add a credit card)
3. Once verified, go to your Twilio dashboard

## Step 2: Get Your Twilio Credentials

1. In your Twilio dashboard, find the following credentials:
   - Account SID
   - Auth Token
   - Verify Service SID (if you're using Verify) or create a new Verify service

## Step 3: Configure Supabase

1. Go to your Supabase dashboard
2. Navigate to Authentication → Settings → Phone
3. Enable "Phone Signup"
4. Select "Twilio" as the provider
5. Enter your Twilio credentials:
   - Twilio Account SID
   - Twilio Auth Token
   - Twilio Message Service SID or Verify Service SID
6. Save changes

## Step 4: Test Phone Authentication

1. In your app, try to sign up with a phone number
2. Make sure to format the phone number correctly (with country code, e.g., +1234567890)
3. You should receive an SMS with a verification code

## Additional Configuration (Optional)

### Custom SMS Templates

1. Still in the Supabase Authentication settings, you can customize the SMS template
2. This allows you to change the format of the SMS message sent to users

### Auto-Confirmation

1. If you want users to be automatically logged in after verifying OTP, enable "Auto-confirm" in the settings
2. This eliminates the need for a separate login step after verification

## Troubleshooting

If OTP is not working:

1. Check that the phone number is formatted correctly (must include country code with + prefix)
2. Verify your Twilio account has enough credit to send SMS
3. Look at Supabase logs (under Authentication → Logs) for any error messages
4. Test the Twilio service directly from the Twilio console to ensure it's working

## Note

For development, Twilio allows sending SMS to verified phone numbers without purchasing a phone number. For production, you'll need to either:

1. Purchase a Twilio phone number, or
2. Use Twilio Verify which doesn't require a dedicated phone number
