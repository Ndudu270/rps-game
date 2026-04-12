// Express + Socket.IO Server for Real-Time PvP Combat

import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { CombatEngine } from './engine/combat-engine';
import { GameState, TurnSelection } from './types';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// In-memory game storage (replace with Redis in production)
const games: Map<string, { engine: CombatEngine; players: Map<string, Socket> }> = new Map();

// REST API Routes

/**
 * Create a new game session
 */
app.post('/api/game/create', (req, res) => {
  const { player1Name, player2Name } = req.body;
  
  if (!player1Name || !player2Name) {
    return res.status(400).json({ error: 'Both player names are required' });
  }

  const player1Id = uuidv4();
  const player2Id = uuidv4();
  
  const gameState = CombatEngine.createNewGame(player1Id, player1Name, player2Id, player2Name);
  const engine = new CombatEngine(gameState);
  
  const gameId = gameState.id;
  games.set(gameId, {
    engine,
    players: new Map(),
  });

  res.json({
    gameId,
    player1Id,
    player2Id,
    gameState,
  });
});

/**
 * Get current game state
 */
app.get('/api/game/:gameId', (req, res) => {
  const { gameId } = req.params;
  const game = games.get(gameId);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }

  res.json(game.engine.getState());
});

// Socket.IO Real-Time Events

io.on('connection', (socket: Socket) => {
  console.log(`Player connected: ${socket.id}`);

  /**
   * Player joins a game
   */
  socket.on('join-game', ({ gameId, playerId }: { gameId: string; playerId: string }) => {
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Verify player is part of this game
    const state = game.engine.getState();
    const isValidPlayer = state.players.some(p => p.id === playerId);
    
    if (!isValidPlayer) {
      socket.emit('error', { message: 'Invalid player ID for this game' });
      return;
    }

    game.players.set(playerId, socket);
    socket.join(gameId);
    
    console.log(`Player ${playerId} joined game ${gameId}`);
    
    // Send current state to the player
    socket.emit('game-state', state);
    
    // Notify other player
    socket.to(gameId).emit('player-joined', { playerId });
  });

  /**
   * Player submits turn selection
   */
  socket.on('submit-turn', ({ gameId, playerId, selection }: { 
    gameId: string; 
    playerId: string; 
    selection: TurnSelection 
  }) => {
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    const state = game.engine.getState();
    const playerIndex = state.players.findIndex(p => p.id === playerId);
    
    if (playerIndex === -1) {
      socket.emit('error', { message: 'Invalid player ID' });
      return;
    }

    // Validate and process selection
    const success = game.engine.processTurnSelection(playerIndex as 0 | 1, selection);
    
    if (!success) {
      socket.emit('error', { message: 'Invalid move (not enough AP or invalid stance)' });
      return;
    }

    console.log(`Player ${playerId} submitted turn in game ${gameId}`);

    // Check if both players have submitted
    const p1Action = (state.players[0] as any)._pendingAction;
    const p2Action = (state.players[1] as any)._pendingAction;

    if (p1Action && p2Action) {
      // Both ready, resolve turn
      game.engine.resolveTurn();
      
      const newState = game.engine.getState();
      
      // Broadcast new state to all players
      io.to(gameId).emit('game-state', newState);
      
      if (newState.phase === 'ended') {
        io.to(gameId).emit('game-over', { winner: newState.winner });
      }
    } else {
      // Acknowledge submission, waiting for opponent
      socket.emit('turn-submitted', { message: 'Waiting for opponent...' });
    }
  });

  /**
   * Player disconnects
   */
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Find and remove from all games
    games.forEach((game, gameId) => {
      game.players.delete(socket.id);
      socket.to(gameId).emit('player-left', { socketId: socket.id });
    });
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', games: games.size });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});

export { app, io, httpServer };
