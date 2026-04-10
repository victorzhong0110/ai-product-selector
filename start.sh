#!/bin/bash
# ─────────────────────────────────────────────────────────────
# AI 选品决策工具 — 一键启动脚本
# ─────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
PORT_BACKEND=8000
PORT_FRONTEND=8080

# ── Colors ────────────────────────────────────────────────────
GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; RESET='\033[0m'

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${RESET}"
echo -e "${BLUE}║     AI 选品决策工具  v1.0                ║${RESET}"
echo -e "${BLUE}║     Cross-border E-commerce Intelligence ║${RESET}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${RESET}"
echo ""

# ── Check Python ──────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
  echo "❌ Python3 not found. Please install Python 3.8+"
  exit 1
fi

# ── Check Tornado ─────────────────────────────────────────────
python3 -c "import tornado" 2>/dev/null || {
  echo "📦 Installing tornado..."
  pip3 install tornado --break-system-packages -q
}

# ── Optional API Key ──────────────────────────────────────────
if [ -f "$BACKEND_DIR/.env" ]; then
  source "$BACKEND_DIR/.env"
  echo -e "${GREEN}✅ .env loaded${RESET}"
fi

if [ -n "$MINIMAX_API_KEY" ]; then
  echo -e "${GREEN}⚡ MiniMax AI 模式已启用（MiniMax-Text-01）${RESET}"
else
  echo -e "${YELLOW}⚠️  演示模式运行（未检测到 MINIMAX_API_KEY）${RESET}"
  echo -e "   如需启用 MiniMax AI：在 backend/.env 中配置 MINIMAX_API_KEY=sk-..."
fi
echo ""

# ── Kill existing processes ───────────────────────────────────
echo "🔄 Stopping any existing processes..."
pkill -f "python3 main.py" 2>/dev/null || true
pkill -f "python3 -m http.server $PORT_FRONTEND" 2>/dev/null || true
sleep 1

# ── Start Backend ─────────────────────────────────────────────
echo -e "${BLUE}🚀 Starting backend (port $PORT_BACKEND)...${RESET}"
cd "$BACKEND_DIR"
python3 main.py &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# ── Wait for backend ──────────────────────────────────────────
echo "   Waiting for backend to initialize..."
for i in $(seq 1 10); do
  if curl -s "http://localhost:$PORT_BACKEND/api/health" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Backend ready${RESET}"
    break
  fi
  sleep 1
done

# ── Start Frontend ────────────────────────────────────────────
echo -e "${BLUE}🌐 Starting frontend (port $PORT_FRONTEND)...${RESET}"
cd "$FRONTEND_DIR"
python3 -m http.server $PORT_FRONTEND --bind 127.0.0.1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

# ── Print access info ─────────────────────────────────────────
sleep 1
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}║  🎉 Application Ready!                   ║${RESET}"
echo -e "${GREEN}║                                          ║${RESET}"
echo -e "${GREEN}║  Frontend: http://localhost:$PORT_FRONTEND        ║${RESET}"
echo -e "${GREEN}║  API Docs: http://localhost:$PORT_BACKEND        ║${RESET}"
echo -e "${GREEN}║                                          ║${RESET}"
echo -e "${GREEN}║  Press Ctrl+C to stop                    ║${RESET}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${RESET}"
echo ""

# ── Keep running ──────────────────────────────────────────────
trap "echo ''; echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
