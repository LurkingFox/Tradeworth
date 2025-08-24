📊 Professional Trading Journal
🔹 Overview

This project is a React-based professional trading journal and risk management platform. It combines a risk calculator, trade journal, analytics dashboard, market news, economic calendar, and even AI-powered trade analysis to help traders improve performance and manage risk effectively.

✨ Features

📈 Risk Calculator – Automatically calculates position sizing, pip values, risk/reward ratio, and break-even win rate.

📒 Trade Journal – Record, edit, filter, and track trades with full details (entry, exit, stop loss, take profit, notes, setups).

📂 Import Trade History – Supports CSV/TXT broker exports, MT4/MT5 formats, and custom parsing.

📰 Market News & Economic Calendar – Live TradingView news feed and economic events integration.

📊 Analytics – Performance statistics: win rate, profit factor, average win/loss, open vs. closed trades.

🤖 AI Analysis (Claude Integration) – Upload your API key and get professional insights on performance, risk, and strategies.

🎯 Trading Goals – Set, track, and manage milestones for long-term trading improvement.

📅 Calendar View – Visualize trades and P&L by date.

💹 Advanced Charts – Embedded TradingView professional charting with indicators and drawing tools.

🛠️ Tech Stack

Frontend: React + TailwindCSS

Icons: lucide-react

Charts/News/Calendar: TradingView Widgets

AI Analysis: Anthropic Claude API (optional, user-provided API key)

🚀 Installation & Setup
# 1. Clone the repository
git clone https://github.com/LurkingFox/Tradeworth.git

# 2. Enter the project folder
cd professional-trading-journal

# 3. Install dependencies
npm install

# 4. Run the development server
npm start

📖 Usage

Navigate between tabs:

Risk Calculator → define trade parameters and auto-calc position size.

Journal → log trades, edit, import broker history.

Charts → use TradingView charts for live analysis.

News/Calendar → follow real-time news and economic events.

Analytics → review performance metrics.

AI Analysis → get professional recommendations (Claude API key required).

Goals → track your personal trading objectives.

Import trade history via:

CSV/TXT file upload

Copy-paste raw trade history

📂 Project Structure

src/

│── App.js             # Main application with all features

│── components/        # (Future: Extract reusable UI components here)

│── styles/            # TailwindCSS styling

public/

│── index.html

✅ Roadmap

 Add more broker-specific import formats

 Cloud storage for trades & goals

 Multi-language support

 Mobile-friendly layout

🤝 Contributing

Contributions are welcome!

Fork the repository

Create a new branch (git checkout -b feature-name)

Commit your changes (git commit -m "Add feature")

Push and open a Pull Request

📜 License

This project is licensed under the MIT License.
