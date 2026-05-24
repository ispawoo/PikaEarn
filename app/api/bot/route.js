// app/api/bot/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    // Fallback: If no token or running on placeholders, return success immediately to prevent webhook queue blocks
    if (!token || token === 'placeholder-bot-token' || token === 'your-telegram-bot-token-here') {
      return NextResponse.json({ success: true, message: 'Telegram Bot Token is not configured yet in env variables.' });
    }

    const body = await request.json();
    
    // Telegram sends chat updates under the 'message' parameter
    if (body.message && body.message.chat) {
      const chatId = body.message.chat.id;
      const text = body.message.text || '';

      // Check if it's the start command: /start or /start <referrer_id>
      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        let referrerId = null;
        if (parts.length > 1) {
          referrerId = parts[1].trim(); // Extract referrer ID from start payload
        }

        // Resolve the host dynamically to ensure it works on both Vercel domains and local dev tunnels
        const host = request.headers.get('host') || 'pika-earn.vercel.app';
        const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
        
        // Build the Mini App launch link
        // Telegram WebApp button supports startapp parameter. Inside the app, we parse this parameter!
        const webAppUrl = `${protocol}://${host}/${referrerId ? `?start_param=${referrerId}` : ''}`;
        const inviteFriendUrl = `https://t.me/share/url?url=${encodeURIComponent(`https://t.me/PikaEarn_bot/app?startapp=${chatId}`)}&text=${encodeURIComponent('🎁 Watch ads and earn real cash! Join PikaEarn and withdraw instantly starting from $5.00! 🚀')}`;

        // Wealthy welcome card
        const welcomeMessage = `⚡ *Welcome to PikaEarn!* ⚡\n\n` +
          `Watch ads, invite friends, and earn real money instantly inside Telegram! 🚀\n\n` +
          `💰 *Reward Per Ad:* $0.10 USD\n` +
          `💸 *Minimum Cashout:* $5.00 USD\n` +
          `🎁 *Referral Bonus:* 10% Lifetime\n\n` +
          `Click the *START EARNING NOW* button below to launch the Mini App and start collecting USD! 👇`;

        // Reply to user chat using Telegram Bot API
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcomeMessage,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🚀 START EARNING NOW',
                    web_app: {
                      url: webAppUrl
                    }
                  }
                ],
                [
                  {
                    text: '👥 Invite Friends',
                    url: inviteFriendUrl
                  }
                ]
              ]
            }
          })
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram Webhook error:', error);
    // Return a 200 success response even on error to prevent Telegram from infinitely retrying failing webhook updates
    return NextResponse.json({ success: false, error: error.message });
  }
}
