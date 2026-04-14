import { Character, spendSkillPoints } from '../../shared/types/character';
import { SkillDefinition, SKILL_DATABASE, getSkillById, getSkillsForClass } from '../data/skills';

/**
 * Skill System Manager
 * Handles skill unlocking, upgrading, and combat integration
 */

export interface SkillUsageResult {
  success: boolean;
  damage?: number;
  heal?: number;
  buff?: { stat: string; value: number; duration: number };
  message: string;
}

export class SkillSystem {
  /**
   * Calculate the cost to upgrade a skill
   */
  static getUpgradeCost(skill: SkillDefinition, currentLevel: number): number {
    if (currentLevel >= skill.maxLevel) {
      return Infinity;
    }
    return skill.upgradeCostBase * (currentLevel + 1);
  }

  /**
   * Check if a character can learn a skill
   */
  static canLearnSkill(character: Character, skill: SkillDefinition): boolean {
    // Check class requirement
    if (skill.requiredClass && character.class !== skill.requiredClass) {
      return false;
    }

    // Check level requirement
    if (skill.requiredLevel && character.level < skill.requiredLevel) {
      return false;
    }

    // Check if already learned
    const alreadyLearned = character.learnedSkills.some(s => s.skillId === skill.id);
    if (alreadyLearned) {
      return false;
    }

    // Check skill points
    if (character.skillPoints < skill.baseCost) {
      return false;
    }

    return true;
  }

  /**
   * Check if a character can upgrade a skill
   */
  static canUpgradeSkill(character: Character, skillId: string): boolean {
    const learnedSkill = character.learnedSkills.find(s => s.skillId === skillId);
    if (!learnedSkill) {
      return false;
    }

    const skillDef = getSkillById(skillId);
    if (!skillDef) {
      return false;
    }

    if (learnedSkill.upgradeLevel >= skillDef.maxLevel) {
      return false;
    }

    const cost = this.getUpgradeCost(skillDef, learnedSkill.upgradeLevel);
    return character.skillPoints >= cost;
  }

  /**
   * Learn a new skill
   */
  static learnSkill(character: Character, skillId: string): boolean {
    const skill = getSkillById(skillId);
    if (!skill) {
      return false;
    }

    if (!this.canLearnSkill(character, skill)) {
      return false;
    }

    return spendSkillPoints(character, skillId, skill.baseCost);
  }

  /**
   * Upgrade an existing skill
   */
  static upgradeSkill(character: Character, skillId: string): boolean {
    const skill = getSkillById(skillId);
    if (!skill) {
      return false;
    }

    if (!this.canUpgradeSkill(character, skillId)) {
      return false;
    }

    const learnedSkill = character.learnedSkills.find(s => s.skillId === skillId);
    if (!learnedSkill) {
      return false;
    }

    const cost = this.getUpgradeCost(skill, learnedSkill.upgradeLevel);
    
    return spendSkillPoints(character, skillId, cost);
  }

  /**
   * Execute a skill in combat
   */
  static executeSkill(
    skillId: string,
    character: Character,
    target?: any
  ): SkillUsageResult {
    const skill = getSkillById(skillId);
    if (!skill) {
      return { success: false, message: 'Skill not found' };
    }

    const learnedSkill = character.learnedSkills.find(s => s.skillId === skillId);
    if (!learnedSkill) {
      return { success: false, message: 'Skill not learned' };
    }

    // Calculate effective value based on upgrade level and scaling stat
    const upgradeMultiplier = 1 + (learnedSkill.upgradeLevel * 0.2); // 20% per upgrade
    let baseValue = skill.effect.value * upgradeMultiplier;

    // Apply stat scaling
    if (skill.effect.scaling) {
      const statValue = character.baseStats[skill.effect.scaling as keyof typeof character.baseStats] || 0;
      baseValue += statValue * 0.5; // 50% of stat value
    }

    switch (skill.effect.type) {
      case 'damage':
        return {
          success: true,
          damage: Math.floor(baseValue),
          message: `${skill.name} deals ${Math.floor(baseValue)} damage!`,
        };

      case 'heal':
        return {
          success: true,
          heal: Math.floor(baseValue),
          message: `${skill.name} heals ${Math.floor(baseValue)} HP!`,
        };

      case 'buff':
        const buffDuration = 3; // 3 turns
        return {
          success: true,
          buff: {
            stat: skill.effect.type,
            value: Math.floor(baseValue),
            duration: buffDuration,
          },
          message: `${skill.name} buffs for ${Math.floor(baseValue)} for ${buffDuration} turns!`,
        };

      case 'stat_boost':
        // Passive skills don't execute directly
        return {
          success: false,
          message: `${skill.name} is a passive skill`,
        };

      default:
        return {
          success: false,
          message: 'Unknown skill effect type',
        };
    }
  }

  /**
   * Get all available skills for a character (including locked ones)
   */
  static getAvailableSkills(character: Character): Array<{
    skill: SkillDefinition;
    learned: boolean;
    upgradeLevel: number;
    canLearn: boolean;
    canUpgrade: boolean;
    learnCost: number;
    upgradeCost: number;
  }> {
    const availableSkills = getSkillsForClass(character.class as any);
    
    return availableSkills.map(skill => {
      const learnedSkill = character.learnedSkills.find(s => s.skillId === skill.id);
      const learned = !!learnedSkill;
      const upgradeLevel = learnedSkill ? learnedSkill.upgradeLevel : 0;
      const canLearn = !learned && this.canLearnSkill(character, skill);
      const canUpgrade = learned && this.canUpgradeSkill(character, skill.id);
      const learnCost = skill.baseCost;
      const upgradeCost = learned ? this.getUpgradeCost(skill, upgradeLevel) : 0;

      return {
        skill,
        learned,
        upgradeLevel,
        canLearn,
        canUpgrade,
        learnCost,
        upgradeCost,
      };
    });
  }

  /**
   * Get skills for the skill shop display
   */
  static getSkillShopItems(character: Character): Array<{
    skill: SkillDefinition;
    locked: boolean;
    reason?: string;
    action: 'learn' | 'upgrade' | 'none';
    cost: number;
  }> {
    const allSkills = SKILL_DATABASE;
    
    return allSkills.map(skill => {
      const learnedSkill = character.learnedSkills.find(s => s.skillId === skill.id);
      const learned = !!learnedSkill;
      
      // Check if locked
      let locked = false;
      let reason: string | undefined;
      
      if (skill.requiredClass && character.class !== skill.requiredClass) {
        locked = true;
        reason = `Requires ${skill.requiredClass} class`;
      } else if (skill.requiredLevel && character.level < skill.requiredLevel) {
        locked = true;
        reason = `Requires level ${skill.requiredLevel}`;
      }

      // Determine action
      let action: 'learn' | 'upgrade' | 'none' = 'none';
      let cost = 0;

      if (!locked) {
        if (!learned) {
          action = 'learn';
          cost = skill.baseCost;
        } else if (learnedSkill!.upgradeLevel < skill.maxLevel) {
          action = 'upgrade';
          cost = this.getUpgradeCost(skill, learnedSkill!.upgradeLevel);
        }
      }

      return {
        skill,
        locked,
        reason,
        action,
        cost,
      };
    });
  }

  /**
   * Apply passive skill bonuses to stats
   */
  static applyPassiveBonuses(character: Character): void {
    // This would be called when recalculating derived stats
    // For now, passive bonuses are applied through the effect system
    character.learnedSkills.forEach(learnedSkill => {
      const skill = getSkillById(learnedSkill.skillId);
      if (skill && skill.type === 'passive' && skill.effect.type === 'stat_boost') {
        // Passive bonuses are already factored into calculations
        // This is a placeholder for more complex passive systems
      }
    });
  }
}
