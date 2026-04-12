// Combat Rules Engine - Core Game Logic

import {
  GameState,
  PlayerState,
  TurnSelection,
  AbilityResult,
  Stats,
  StanceType,
  CombatLogEntry,
} from '../types';
import { VOID_WALKER_ABILITIES, VOID_WALKER_STANCES } from '../classes/void-walker';

export class CombatEngine {
  private state: GameState;

  constructor(gameState: GameState) {
    this.state = gameState;
  }

  getState(): GameState {
    return this.state;
  }

  /**
   * Validate and apply player's turn selection
   */
  processTurnSelection(playerIndex: 0 | 1, selection: TurnSelection): boolean {
    const player = this.state.players[playerIndex];
    
    // Validate AP cost
    const ability = this.getAbilityById(selection.ability);
    if (!ability) return false;
    
    // Check if enough AP (unless in Singularity stance)
    if (selection.stance !== 'singularity' && player.actionPoints < ability.apCost) {
      return false;
    }

    // Validate stance availability
    if (selection.stance === 'entropy' && player.stats.flux <= 80) {
      return false;
    }

    // Apply stance change
    player.currentStance = selection.stance;

    // Store selection temporarily for resolution phase
    (player as any)._pendingAction = selection;

    return true;
  }

  /**
   * Resolve both players' actions for the turn
   */
  resolveTurn(): void {
    const [player1, player2] = this.state.players;
    const p1Action = (player1 as any)._pendingAction as TurnSelection | undefined;
    const p2Action = (player2 as any)._pendingAction as TurnSelection | undefined;

    if (!p1Action || !p2Action) {
      // Handle missing actions (timeout/AFK)
      this.logAction('SYSTEM', 'One or both players failed to act', 'Turn skipped');
      this.cleanupTurn();
      return;
    }

    // Determine turn order by speed stat
    const firstPlayer = player1.stats.speed >= player2.stats.speed ? 0 : 1;
    const secondPlayer = firstPlayer === 0 ? 1 : 0;

    // Execute actions in order
    this.executeAction(firstPlayer, secondPlayer, firstPlayer === 0 ? p1Action : p2Action);
    this.executeAction(secondPlayer, firstPlayer, secondPlayer === 0 ? p1Action : p2Action);

    // Apply end-of-turn effects (Entropy self-damage, status effect ticks)
    this.applyEndOfTurnEffects();

    // Cleanup and prepare next turn
    this.cleanupTurn();

    // Check win condition
    this.checkWinCondition();

    // Advance turn counter
    if (this.state.phase !== 'ended') {
      this.state.turn++;
      this.state.currentPlayerIndex = this.state.currentPlayerIndex === 0 ? 1 : 0;
      this.state.phase = 'selection';
    }
  }

  /**
   * Execute a single player's action
   */
  private executeAction(
    actorIndex: number,
    targetIndex: number,
    selection: TurnSelection
  ): void {
    const actor = this.state.players[actorIndex];
    const target = this.state.players[targetIndex];
    const ability = this.getAbilityById(selection.ability);

    if (!ability) {
      this.logAction(actor.name, selection.ability, 'Invalid ability');
      return;
    }

    // Check for stun
    const stunned = actor.statusEffects.find(e => e.type === 'stun' && e.duration > 0);
    if (stunned) {
      this.logAction(actor.name, selection.ability, 'Stunned, cannot act');
      stunned.duration--;
      return;
    }

    // Check for dodge-next on target
    const dodgeEffect = target.statusEffects.find(e => e.type === 'dodge-next' && e.duration > 0);
    if (dodgeEffect && Math.random() < 1.0) // 100% dodge for next attack
    {
      dodgeEffect.duration--;
      if (dodgeEffect.duration <= 0) {
        target.statusEffects = target.statusEffects.filter(e => e !== dodgeEffect);
      }
      this.logAction(actor.name, selection.ability, `Attack dodged by ${target.name}!`);
      
      // Consume AP even if dodged
      if (selection.stance !== 'singularity') {
        actor.actionPoints -= ability.apCost;
      }
      return;
    }

    // Execute ability
    const context = {
      user: actor,
      target,
      stance: selection.stance,
      turn: this.state.turn,
    };

    const result = ability.execute(context);

    // Apply damage with stance modifiers
    if (result.damage !== undefined && result.damage > 0) {
      const stance = VOID_WALKER_STANCES[selection.stance];
      let finalDamage = result.damage;

      // Apply stance damage bonus
      if (stance.effects.damageBonus) {
        finalDamage = Math.floor(finalDamage * (1 + stance.effects.damageBonus));
      }

      // Apply defense reduction
      const defenseMultiplier = stance.effects.defenseIgnore 
        ? 1 - stance.effects.defenseIgnore 
        : 1;
      finalDamage = Math.floor(finalDamage * defenseMultiplier);

      // Reduce by target defense (simplified formula)
      finalDamage = Math.max(1, finalDamage - Math.floor(target.stats.defense * 0.5));

      // Check for clone
      const cloneEffect = target.statusEffects.find(e => e.type === 'clone');
      if (cloneEffect && Math.random() < (cloneEffect.value || 0.5)) {
        this.logAction(actor.name, selection.ability, `Hit clone instead! (${finalDamage} damage)`);
        cloneEffect.duration--;
        if (cloneEffect.duration <= 0) {
          target.statusEffects = target.statusEffects.filter(e => e !== cloneEffect);
        }
      } else {
        target.stats.hp = Math.max(0, target.stats.hp - finalDamage);
        this.logAction(actor.name, selection.ability, `Dealt ${finalDamage} damage to ${target.name}`);
      }
    }

    // Apply healing
    if (result.healing !== undefined && result.healing > 0) {
      actor.stats.hp = Math.min(actor.stats.maxHp, actor.stats.hp + result.healing);
      this.logAction(actor.name, selection.ability, `Healed for ${result.healing} HP`);
    }

    // Apply self-damage
    if (result.selfDamage !== undefined && result.selfDamage > 0) {
      actor.stats.hp = Math.max(1, actor.stats.hp - result.selfDamage);
      this.logAction(actor.name, selection.ability, `Took ${result.selfDamage} self-damage`);
    }

    // Apply status effects
    if (result.statusEffects) {
      result.statusEffects.forEach(effect => {
        target.statusEffects.push(effect);
      });
    }

    // Apply stun to self
    if (result.stunUser) {
      actor.statusEffects.push({ type: 'stun', duration: 1 });
    }

    // Apply permanent HP reduction (from ultimate)
    if (result.hpReductionPermanent !== undefined) {
      actor.permanentHpReduction += result.hpReductionPermanent;
      actor.stats.maxHp = Math.floor(actor.stats.maxHp * (1 - result.hpReductionPermanent));
      actor.stats.hp = Math.min(actor.stats.hp, actor.stats.maxHp);
      this.logAction(actor.name, selection.ability, `Permanently lost ${(result.hpReductionPermanent * 100)}% max HP!`);
    }

    // Apply Flux changes
    if (result.fluxGenerated !== undefined) {
      const stance = VOID_WALKER_STANCES[selection.stance];
      let fluxChange = result.fluxGenerated;

      // Apply flux generation multiplier from stance
      if (fluxChange > 0 && stance.effects.fluxGenerationMultiplier) {
        fluxChange = Math.floor(fluxChange * stance.effects.fluxGenerationMultiplier);
      }

      actor.stats.flux = Math.max(0, Math.min(100, actor.stats.flux + fluxChange));
    }

    // Consume AP (unless in Singularity)
    if (selection.stance !== 'singularity') {
      actor.actionPoints = Math.max(0, actor.actionPoints - ability.apCost);
    }
  }

  /**
   * Apply end-of-turn effects
   */
  private applyEndOfTurnEffects(): void {
    this.state.players.forEach(player => {
      // Entropy stance self-damage
      if (player.currentStance === 'entropy' && player.stats.flux > 80) {
        const stance = VOID_WALKER_STANCES['entropy'];
        const selfDamage = Math.floor(player.stats.flux * (stance.effects.endTurnDamageFluxPercent || 0.10));
        player.stats.hp = Math.max(1, player.stats.hp - selfDamage);
        this.logAction(player.name, 'Entropy', `Took ${selfDamage} entropy damage`);
      }

      // Tick down status effects
      player.statusEffects.forEach(effect => {
        effect.duration--;
      });
      player.statusEffects = player.statusEffects.filter(e => e.duration > 0);

      // Restore AP for next turn (base 3, +1 from Zero-Point Reset handled separately)
      player.actionPoints = 3;

      // Bonus AP from Zero-Point Reset would be tracked separately
    });
  }

  /**
   * Cleanup temporary state after turn resolution
   */
  private cleanupTurn(): void {
    this.state.players.forEach(player => {
      delete (player as any)._pendingAction;
    });
  }

  /**
   * Check for win condition
   */
  private checkWinCondition(): void {
    const [p1, p2] = this.state.players;

    if (p1.stats.hp <= 0 && p2.stats.hp <= 0) {
      this.state.phase = 'ended';
      this.state.winner = 'draw';
      this.logAction('SYSTEM', 'Game Over', 'Draw - Both players defeated');
    } else if (p1.stats.hp <= 0) {
      this.state.phase = 'ended';
      this.state.winner = p2.id;
      this.logAction('SYSTEM', 'Game Over', `${p2.name} wins!`);
    } else if (p2.stats.hp <= 0) {
      this.state.phase = 'ended';
      this.state.winner = p1.id;
      this.logAction('SYSTEM', 'Game Over', `${p1.name} wins!`);
    }
  }

  /**
   * Helper to get ability by ID
   */
  private getAbilityById(id: string) {
    return VOID_WALKER_ABILITIES.find(a => a.id === id);
  }

  /**
   * Log action to combat log
   */
  private logAction(player: string, action: string, result: string): void {
    const entry: CombatLogEntry = {
      turn: this.state.turn,
      player,
      action,
      result,
      timestamp: new Date(),
    };
    this.state.log.push(entry);
  }

  /**
   * Initialize a new game state with two Void-Walker players
   */
  static createNewGame(player1Id: string, player1Name: string, player2Id: string, player2Name: string): GameState {
    const baseStats: Stats = {
      hp: 100,
      maxHp: 100,
      speed: 10,
      defense: 5,
      critChance: 0.15,
      critDamage: 1.5,
      flux: 0,
    };

    const createPlayer = (id: string, name: string): PlayerState => ({
      id,
      name,
      race: 'human',
      faction: 'neutral',
      classType: 'void-walker',
      stats: { ...baseStats },
      currentStance: 'phase-shift',
      actionPoints: 3,
      maxActionPoints: 3,
      abilities: ['void-slash', 'flash-step', 'flux-burn', 'paradox-clone', 'event-horizon', 'zero-point-reset', 'collapse-reality'],
      statusEffects: [],
      permanentHpReduction: 0,
    });

    return {
      id: `game-${Date.now()}`,
      players: [createPlayer(player1Id, player1Name), createPlayer(player2Id, player2Name)],
      turn: 1,
      currentPlayerIndex: 0,
      phase: 'selection',
      log: [],
    };
  }
}
