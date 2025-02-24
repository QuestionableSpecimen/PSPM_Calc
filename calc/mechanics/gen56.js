"use strict";
exports.__esModule = true;

var util_1 = require("../util");
var items_1 = require("../items");
var result_1 = require("../result");
var util_2 = require("./util");
function calculateBWXY(gen, attacker, defender, move, field) {
    var _a;
    util_2.checkAirLock(attacker, field);
    util_2.checkAirLock(defender, field);
    util_2.checkForecast(attacker, field.weather);
    util_2.checkForecast(defender, field.weather);
    util_2.checkItem(attacker, field.isMagicRoom);
    util_2.checkItem(defender, field.isMagicRoom);
    util_2.checkSeedBoost(attacker, field);
    util_2.checkSeedBoost(defender, field);
    util_2.computeFinalStats(gen, attacker, defender, field, 'def', 'spd', 'spe');
    util_2.checkIntimidate(gen, attacker, defender);
    util_2.checkIntimidate(gen, defender, attacker);
    util_2.checkDownload(attacker, defender, field.isWonderRoom);
    util_2.checkDownload(defender, attacker, field.isWonderRoom);
    util_2.computeFinalStats(gen, attacker, defender, field, 'atk', 'spa');
    util_2.checkInfiltrator(attacker, field.defenderSide);
    util_2.checkInfiltrator(defender, field.attackerSide);
    var desc = {
        attackerName: attacker.name,
        moveName: move.name,
        defenderName: defender.name
    };
    var result = new result_1.Result(gen, attacker, defender, move, field, 0, desc);
    if (move.category === 'Status' && !move.named('Nature Power')) {
        return result;
    }
    if (field.defenderSide.isProtected && !move.breaksProtect) {
        desc.isProtected = true;
        return result;
    }
    if (attacker.hasAbility('Mold Breaker', 'Teravolt', 'Turboblaze')) {
        defender.ability = '';
        desc.attackerAbility = attacker.ability;
    }
    var isCritical = move.isCrit && !defender.hasAbility('Battle Armor', 'Shell Armor') && move.timesUsed === 1;
    if (move.named('Weather Ball')) {
        move.type =
            field.hasWeather('Sun', 'Harsh Sunshine') ? 'Fire'
                : field.hasWeather('Rain', 'Heavy Rain') ? 'Water'
                    : field.hasWeather('Sand') ? 'Rock'
                        : field.hasWeather('Hail') ? 'Ice'
                            : 'Normal';
        desc.weather = field.weather;
        desc.moveType = move.type;
    }
    else if (move.named('Judgment') && attacker.item && attacker.item.includes('Plate')) {
        move.type = items_1.getItemBoostType(attacker.item);
    }
    else if (move.named('Techno Blast') && attacker.item && attacker.item.includes('Drive')) {
        move.type = items_1.getTechnoBlast(attacker.item);
    }
    else if (move.named('Natural Gift') && attacker.item && attacker.item.includes('Berry')) {
        var gift = items_1.getNaturalGift(gen, attacker.item);
        move.type = gift.t;
        move.bp = gift.p;
        desc.attackerItem = attacker.item;
        desc.moveBP = move.bp;
        desc.moveType = move.type;
    }
    else if (move.named('Nature Power')) {
        move.type =
            field.hasTerrain('Electric') ? 'Electric'
                : field.hasTerrain('Grassy') ? 'Grass'
                    : field.hasTerrain('Misty') ? 'Fairy'
                        : field.hasTerrain('Psychic') ? 'Psychic'
                            : 'Normal';
    }
    var isAerilate = false;
    var isPixilate = false;
    var isRefrigerate = false;
    var isNormalize = false;
    var noTypeChange = move.named('Judgment', 'Nature Power', 'Techo Blast', 'Natural Gift', 'Weather Ball');
    if (!move.isZ && !noTypeChange) {
        var normal = move.hasType('Normal');
        if ((isAerilate = attacker.hasAbility('Aerilate') && normal)) {
            move.type = 'Flying';
        }
        else if ((isPixilate = attacker.hasAbility('Pixilate') && normal)) {
            move.type = 'Fairy';
        }
        else if ((isRefrigerate = attacker.hasAbility('Refrigerate') && normal)) {
            move.type = 'Ice';
        }
        else if ((isNormalize = attacker.hasAbility('Normalize'))) {
            move.type = 'Normal';
        }
        if (isPixilate || isRefrigerate || isAerilate || isNormalize) {
            desc.attackerAbility = attacker.ability;
        }
    }
    if (attacker.hasAbility('Gale Wings') && move.hasType('Flying')) {
        move.priority = 1;
        desc.attackerAbility = attacker.ability;
    }
    var isGhostRevealed = attacker.hasAbility('Scrappy') || field.defenderSide.isForesight;
    var type1Effectiveness = util_2.getMoveEffectiveness(gen, move, defender.types[0], isGhostRevealed, field.isGravity);
    var type2Effectiveness = defender.types[1]
        ? util_2.getMoveEffectiveness(gen, move, defender.types[1], isGhostRevealed, field.isGravity)
        : 1;
    var typeEffectiveness = type1Effectiveness * type2Effectiveness;
    var resistedKnockOffDamage = !defender.item ||
        (defender.named('Giratina-Origin') && defender.hasItem('Griseous Orb')) ||
        (defender.name.includes('Arceus') && defender.item.includes('Plate')) ||
        (defender.name.includes('Genesect') && defender.item.includes('Drive')) ||
        (defender.named('Groudon', 'Groudon-Primal') && defender.hasItem('Red Orb')) ||
        (defender.named('Kyogre', 'Kyogre-Primal') && defender.hasItem('Blue Orb'));
    if (!resistedKnockOffDamage && defender.item) {
        var item = gen.items.get(util_1.toID(defender.item));
        resistedKnockOffDamage = !!(item.megaEvolves && defender.name.includes(item.megaEvolves));
    }
    if (typeEffectiveness === 0 && move.named('Thousand Arrows')) {
        typeEffectiveness = 1;
    }
    else if (typeEffectiveness === 0 && move.hasType('Ground') &&
        defender.hasItem('Iron Ball') && !defender.hasAbility('Klutz')) {
        typeEffectiveness = 1;
    }
    else if (typeEffectiveness === 0 && defender.hasItem('Ring Target')) {
        var effectiveness = gen.types.get(util_1.toID(move.type)).effectiveness;
        if (effectiveness[defender.types[0]] === 0) {
            typeEffectiveness = type2Effectiveness;
        }
        else if (defender.types[1] && effectiveness[defender.types[1]] === 0) {
            typeEffectiveness = type1Effectiveness;
        }
    }
    if (typeEffectiveness === 0) {
        return result;
    }
    if ((move.named('Sky Drop') &&
        (defender.hasType('Flying') || defender.weightkg >= 200 || field.isGravity)) ||
        (move.named('Synchronoise') && !defender.hasType(attacker.types[0]) &&
            (!attacker.types[1] || !defender.hasType(attacker.types[1]))) ||
        (move.named('Dream Eater') && !defender.hasStatus('slp'))) {
        return result;
    }
    if (field.hasWeather('Strong Winds') && defender.hasType('Flying') &&
        gen.types.get(util_1.toID(move.type)).effectiveness['Flying'] > 1) {
        typeEffectiveness /= 2;
        desc.weather = field.weather;
    }
    if ((defender.hasAbility('Wonder Guard') && typeEffectiveness <= 1) ||
        (move.hasType('Grass') && defender.hasAbility('Sap Sipper')) ||
        (move.hasType('Fire') && defender.hasAbility('Flash Fire')) ||
        (move.hasType('Water') && defender.hasAbility('Dry Skin', 'Storm Drain', 'Water Absorb')) ||
        (move.hasType('Electric') &&
            defender.hasAbility('Lightning Rod', 'Motor Drive', 'Volt Absorb')) ||
        (move.hasType('Ground') &&
            !field.isGravity && !move.named('Thousand Arrows') &&
            !defender.hasItem('Iron Ball') && defender.hasAbility('Levitate')) ||
        (move.flags.bullet && defender.hasAbility('Bulletproof')) ||
        (move.flags.sound && defender.hasAbility('Soundproof'))) {
        desc.defenderAbility = defender.ability;
        return result;
    }
    if (move.hasType('Ground') && !move.named('Thousand Arrows') &&
        !field.isGravity && defender.hasItem('Air Balloon')) {
        desc.defenderItem = defender.item;
        return result;
    }
    if (move.priority > 0 && field.hasTerrain('Psychic') && util_2.isGrounded(defender, field)) {
        desc.terrain = field.terrain;
        return result;
    }
    desc.HPEVs = defender.evs.hp + " HP";
    var fixedDamage = util_2.handleFixedDamageMoves(attacker, move);
    if (fixedDamage) {
        if (attacker.hasAbility('Parental Bond')) {
            result.damage = [fixedDamage, fixedDamage];
            desc.attackerAbility = attacker.ability;
        }
        else {
            result.damage = fixedDamage;
        }
        return result;
    }
    if (move.named('Final Gambit')) {
        result.damage = attacker.curHP();
        return result;
    }
    if (move.hits > 1) {
        desc.hits = move.hits;
    }
    var turnOrder = attacker.stats.spe > defender.stats.spe ? 'first' : 'last';
    var basePower;
    switch (move.name) {
        case 'Payback':
            basePower = turnOrder === 'last' ? 100 : 50;
            desc.moveBP = basePower;
            break;
        case 'Electro Ball':
            var r = Math.floor(attacker.stats.spe / defender.stats.spe);
            basePower = r >= 4 ? 150 : r >= 3 ? 120 : r >= 2 ? 80 : r >= 1 ? 60 : 40;
            desc.moveBP = basePower;
            break;
        case 'Gyro Ball':
            basePower = Math.min(150, Math.floor((25 * defender.stats.spe) / attacker.stats.spe));
            desc.moveBP = basePower;
            break;
        case 'Punishment':
            basePower = Math.min(200, 60 + 20 * util_2.countBoosts(gen, defender.boosts));
            desc.moveBP = basePower;
            break;
        case 'Low Kick':
        case 'Grass Knot':
            var w = defender.weightkg * util_2.getWeightFactor(defender);
            basePower = w >= 200 ? 120 : w >= 100 ? 100 : w >= 50 ? 80 : w >= 25 ? 60 : w >= 10 ? 40 : 20;
            desc.moveBP = basePower;
            break;
        case 'Hex':
            basePower = move.bp * (defender.status ? 2 : 1);
            desc.moveBP = basePower;
            break;
        case 'Heavy Slam':
        case 'Heat Crash':
            var wr = (attacker.weightkg * util_2.getWeightFactor(attacker)) /
                (defender.weightkg * util_2.getWeightFactor(defender));
            basePower = wr >= 5 ? 120 : wr >= 4 ? 100 : wr >= 3 ? 80 : wr >= 2 ? 60 : 40;
            desc.moveBP = basePower;
            break;
        case 'Stored Power':
        case 'Power Trip':
            basePower = 20 + 20 * util_2.countBoosts(gen, attacker.boosts);
            desc.moveBP = basePower;
            break;
        case 'Acrobatics':
            basePower = attacker.hasItem('Flying Gem') || !attacker.item ? 110 : 55;
            desc.moveBP = basePower;
            break;
        case 'Assurance':
            basePower = move.bp * (defender.hasAbility('Parental Bond (Child)') ? 2 : 1);
            break;
        case 'Wake-Up Slap':
            basePower = move.bp * (defender.hasStatus('slp') ? 2 : 1);
            desc.moveBP = basePower;
            break;
        case 'Weather Ball':
            basePower = field.weather && !field.hasWeather('Strong Winds') ? 100 : 50;
            desc.moveBP = basePower;
            break;
        case 'Fling':
            basePower = items_1.getFlingPower(attacker.item);
            desc.moveBP = basePower;
            desc.attackerItem = attacker.item;
            break;
        case 'Eruption':
        case 'Water Spout':
            basePower = Math.max(1, Math.floor((150 * attacker.curHP()) / attacker.maxHP()));
            desc.moveBP = basePower;
            break;
        case 'Flail':
        case 'Reversal':
            var p = Math.floor((48 * attacker.curHP()) / attacker.maxHP());
            basePower = p <= 1 ? 200 : p <= 4 ? 150 : p <= 9 ? 100 : p <= 16 ? 80 : p <= 32 ? 40 : 20;
            desc.moveBP = basePower;
            break;
        case 'Nature Power':
            basePower =
                field.terrain && field.hasTerrain('Electric', 'Grassy', 'Psychic') ? 90
                    : field.hasTerrain('Misty') ? 95
                        : 80;
            break;
        case 'Water Shuriken':
            basePower = attacker.named('Greninja-Ash') && attacker.hasAbility('Battle Bond') ? 20 : 15;
            desc.moveBP = basePower;
            break;
        case 'Crush Grip':
        case 'Wring Out':
            basePower = 100 * Math.floor((defender.curHP() * 4096) / defender.maxHP());
            basePower = Math.floor(Math.floor((120 * basePower + 2048 - 1) / 4096) / 100) || 1;
            desc.moveBP = basePower;
            break;
        default:
            basePower = move.bp;
    }
    if (basePower === 0) {
        return result;
    }
    var bpMods = [];
    if ((attacker.hasAbility('Technician') && basePower <= 60) ||
        (attacker.hasAbility('Flare Boost') &&
            attacker.hasStatus('brn') && move.category === 'Special') ||
        (attacker.hasAbility('Toxic Boost') &&
            attacker.hasStatus('psn', 'tox') && move.category === 'Physical')) {
        bpMods.push(6144);
        desc.attackerAbility = attacker.ability;
    }
    else if (attacker.hasAbility('Analytic') && turnOrder !== 'first') {
        bpMods.push(5325);
        desc.attackerAbility = attacker.ability;
    }
    else if (attacker.hasAbility('Sand Force') &&
        field.hasWeather('Sand') &&
        move.hasType('Rock', 'Ground', 'Steel')) {
        bpMods.push(5325);
        desc.attackerAbility = attacker.ability;
        desc.weather = field.weather;
    }
    else if ((attacker.hasAbility('Reckless') && (move.recoil || move.hasCrashDamage)) ||
        (attacker.hasAbility('Iron Fist') && move.flags.punch)) {
        bpMods.push(4915);
        desc.attackerAbility = attacker.ability;
    }
    if (defender.hasAbility('Heatproof') && move.hasType('Fire')) {
        bpMods.push(2048);
        desc.defenderAbility = defender.ability;
    }
    else if (defender.hasAbility('Dry Skin') && move.hasType('Fire')) {
        bpMods.push(5120);
        desc.defenderAbility = defender.ability;
    }
    if (attacker.hasAbility('Sheer Force') && move.secondaries) {
        bpMods.push(5325);
        desc.attackerAbility = attacker.ability;
    }
    if (attacker.hasAbility('Rivalry') && ![attacker.gender, defender.gender].includes('N')) {
        if (attacker.gender === defender.gender) {
            bpMods.push(5120);
            desc.rivalry = 'buffed';
        }
        else {
            bpMods.push(3072);
            desc.rivalry = 'nerfed';
        }
        desc.attackerAbility = attacker.ability;
    }
    if (attacker.item && items_1.getItemBoostType(attacker.item) === move.type) {
        bpMods.push(4915);
        desc.attackerItem = attacker.item;
    }
    else if ((attacker.hasItem('Muscle Band') && move.category === 'Physical') ||
        (attacker.hasItem('Wise Glasses') && move.category === 'Special')) {
        bpMods.push(4505);
        desc.attackerItem = attacker.item;
    }
    else if ((attacker.hasItem('Adamant Orb') &&
        attacker.named('Dialga') &&
        move.hasType('Steel', 'Dragon')) ||
        (attacker.hasItem('Lustrous Orb') &&
            attacker.named('Palkia') &&
            move.hasType('Water', 'Dragon')) ||
        (attacker.hasItem('Griseous Orb') &&
            attacker.named('Giratina-Origin') &&
            move.hasType('Ghost', 'Dragon'))) {
        bpMods.push(4915);
        desc.attackerItem = attacker.item;
    }
    else if (attacker.hasItem(move.type + " Gem")) {
        bpMods.push(gen.num > 5 ? 5325 : 6144);
        desc.attackerItem = attacker.item;
    }
    if ((move.named('Facade') && attacker.hasStatus('brn', 'par', 'psn', 'tox')) ||
        (move.named('Brine') && defender.curHP() <= defender.maxHP() / 2) ||
        (move.named('Venoshock') && defender.hasStatus('psn', 'tox'))) {
        bpMods.push(8192);
        desc.moveBP = basePower * 2;
    }
    else if (move.named('Solar Beam') && field.hasWeather('Rain', 'Heavy Rain', 'Sand', 'Hail')) {
        bpMods.push(2048);
        desc.moveBP = basePower / 2;
        desc.weather = field.weather;
    }
    else if (gen.num > 5 && move.named('Knock Off') && !resistedKnockOffDamage) {
        bpMods.push(6144);
        desc.moveBP = basePower * 1.5;
    }
    if (field.attackerSide.isHelpingHand) {
        bpMods.push(6144);
        desc.isHelpingHand = true;
    }
    if (field.attackerSide.isBattery && move.category === 'Special') {
        bpMods.push(5324);
        desc.isBattery = true;
    }
    if (field.attackerSide.isPowerSpot) {
        bpMods.push(5324);
        desc.isPowerSpot = true;
    }
    if (isAerilate || isPixilate || isRefrigerate || isNormalize) {
        bpMods.push(5325);
        desc.attackerAbility = attacker.ability;
    }
    else if ((attacker.hasAbility('Mega Launcher') && move.flags.pulse) ||
        (attacker.hasAbility('Strong Jaw') && move.flags.bite)) {
        bpMods.push(6144);
        desc.attackerAbility = attacker.ability;
    }
    else if (attacker.hasAbility('Tough Claws') && move.flags.contact) {
        bpMods.push(5325);
        desc.attackerAbility = attacker.ability;
    }
    var aura = move.type + " Aura";
    var isAttackerAura = attacker.hasAbility(aura);
    var isDefenderAura = defender.hasAbility(aura);
    var isUserAuraBreak = attacker.hasAbility('Aura Break') || defender.hasAbility('Aura Break');
    var isFieldAuraBreak = field.isAuraBreak;
    var isFieldFairyAura = field.isFairyAura && move.type === 'Fairy';
    var isFieldDarkAura = field.isDarkAura && move.type === 'Dark';
    if (isFieldFairyAura || isFieldDarkAura || isAttackerAura || isDefenderAura) {
        if (isFieldAuraBreak || isUserAuraBreak) {
            bpMods.push(3072);
            desc.attackerAbility = attacker.ability;
            desc.defenderAbility = defender.ability;
        }
        else {
            bpMods.push(5448);
            if (isAttackerAura) {
                desc.attackerAbility = attacker.ability;
            }
            if (isDefenderAura) {
                desc.defenderAbility = defender.ability;
            }
        }
    }
    if (util_2.isGrounded(attacker, field)) {
        if (field.hasTerrain('Electric') && move.hasType('Electric')) {
            bpMods.push(6144);
            desc.terrain = field.terrain;
        }
        else if (field.hasTerrain('Grassy') && move.hasType('Grass')) {
            bpMods.push(6144);
            desc.terrain = field.terrain;
        }
        else if (field.hasTerrain('Psychic') && move.hasType('Psychic')) {
            bpMods.push(6144);
            desc.terrain = field.terrain;
        }
    }
    if (util_2.isGrounded(defender, field)) {
        if (field.hasTerrain('Misty') && move.hasType('Dragon')) {
            bpMods.push(2048);
            desc.terrain = field.terrain;
        }
        else if (field.hasTerrain('Grassy') && move.named('Bulldoze', 'Earthquake')) {
            bpMods.push(2048);
            desc.terrain = field.terrain;
        }
    }
    basePower = util_2.OF16(Math.max(1, util_2.pokeRound((basePower * util_2.chainMods(bpMods)) / 4096)));
    var attack;
    var attackSource = move.named('Foul Play') ? defender : attacker;
    var attackStat = move.category === 'Special' ? 'spa' : 'atk';
    desc.attackEVs =
        move.named('Foul Play')
            ? util_2.getEVDescriptionText(gen, defender, attackStat, defender.nature)
            : util_2.getEVDescriptionText(gen, attacker, attackStat, attacker.nature);
    if (attackSource.boosts[attackStat] === 0 ||
        (isCritical && attackSource.boosts[attackStat] < 0)) {
        attack = attackSource.rawStats[attackStat];
    }
    else if (defender.hasAbility('Unaware')) {
        attack = attackSource.rawStats[attackStat];
        desc.defenderAbility = defender.ability;
    }
    else {
        attack = attackSource.stats[attackStat];
        desc.attackBoost = attackSource.boosts[attackStat];
    }
    if (attacker.hasAbility('Hustle') && move.category === 'Physical') {
        attack = util_2.pokeRound((attack * 3) / 2);
        desc.attackerAbility = attacker.ability;
    }
    var atMods = [];
    if (defender.hasAbility('Thick Fat') && move.hasType('Fire', 'Ice')) {
        atMods.push(2048);
        desc.defenderAbility = defender.ability;
    }
    if (move.named('Pursuit') && field.defenderSide.isSwitching === 'out') {
        if (attacker.hasAbility('Technician')) {
            atMods.push(4096);
        }
        else {
            atMods.push(8192);
            desc.isSwitching = 'out';
        }
    }
    if ((attacker.hasAbility('Guts') && attacker.status && move.category === 'Physical') ||
        (attacker.curHP() <= attacker.maxHP() / 3 &&
            ((attacker.hasAbility('Overgrow') && move.hasType('Grass')) ||
                (attacker.hasAbility('Blaze') && move.hasType('Fire')) ||
                (attacker.hasAbility('Torrent') && move.hasType('Water')) ||
                (attacker.hasAbility('Swarm') && move.hasType('Bug')))) ||
        (move.category === 'Special' && attacker.abilityOn && attacker.hasAbility('Plus', 'Minus'))) {
        atMods.push(6144);
        desc.attackerAbility = attacker.ability;
    }
    else if (attacker.hasAbility('Flash Fire') && attacker.abilityOn && move.hasType('Fire')) {
        atMods.push(6144);
        desc.attackerAbility = 'Flash Fire';
    }
    else if ((attacker.hasAbility('Solar Power') &&
        field.hasWeather('Sun', 'Harsh Sunshine') &&
        move.category === 'Special') ||
        (attacker.named('Cherrim') &&
            attacker.hasAbility('Flower Gift') &&
            field.hasWeather('Sun', 'Harsh Sunshine') &&
            move.category === 'Physical')) {
        atMods.push(6144);
        desc.attackerAbility = attacker.ability;
        desc.weather = field.weather;
    }
    else if ((attacker.hasAbility('Defeatist') && attacker.curHP() <= attacker.maxHP() / 2) ||
        (attacker.hasAbility('Slow Start') && attacker.abilityOn && move.category === 'Physical')) {
        atMods.push(2048);
        desc.attackerAbility = attacker.ability;
    }
    else if (attacker.hasAbility('Huge Power', 'Pure Power') && move.category === 'Physical') {
        atMods.push(8192);
        desc.attackerAbility = attacker.ability;
    }
    if ((attacker.hasItem('Thick Club') &&
        attacker.named('Cubone', 'Marowak', 'Marowak-Alola') &&
        move.category === 'Physical') ||
        (attacker.hasItem('Deep Sea Tooth') &&
            attacker.named('Clamperl') &&
            move.category === 'Special') ||
        (attacker.hasItem('Light Ball') && attacker.name.startsWith('Pikachu') && !move.isZ)) {
        atMods.push(8192);
        desc.attackerItem = attacker.item;
    }
    else if ((attacker.hasItem('Soul Dew') &&
        attacker.named('Latios', 'Latias', 'Latios-Mega', 'Latias-Mega') &&
        move.category === 'Special') ||
        (attacker.hasItem('Choice Band') && move.category === 'Physical') ||
        (attacker.hasItem('Choice Specs') && move.category === 'Special')) {
        atMods.push(6144);
        desc.attackerItem = attacker.item;
    }
    attack = util_2.OF16(Math.max(1, util_2.pokeRound((attack * util_2.chainMods(atMods)) / 4096)));
    var defense;
    var hitsPhysical = move.defensiveCategory === 'Physical';
    var defenseStat = hitsPhysical ? 'def' : 'spd';
    desc.defenseEVs = util_2.getEVDescriptionText(gen, defender, defenseStat, defender.nature);
    if (defender.boosts[defenseStat] === 0 ||
        (isCritical && defender.boosts[defenseStat] > 0) ||
        move.ignoreDefensive) {
        defense = defender.rawStats[defenseStat];
    }
    else if (attacker.hasAbility('Unaware')) {
        defense = defender.rawStats[defenseStat];
        desc.attackerAbility = attacker.ability;
    }
    else {
        defense = defender.stats[defenseStat];
        desc.defenseBoost = defender.boosts[defenseStat];
    }
    if (field.hasWeather('Sand') && defender.hasType('Rock') && !hitsPhysical) {
        defense = util_2.pokeRound((defense * 3) / 2);
        desc.weather = field.weather;
    }
    var dfMods = [];
    if (defender.hasAbility('Marvel Scale') && defender.status && hitsPhysical) {
        dfMods.push(6144);
        desc.defenderAbility = defender.ability;
    }
    else if (defender.named('Cherrim') &&
        defender.hasAbility('Flower Gift') &&
        field.hasWeather('Sun', 'Harsh Sunshine') &&
        !hitsPhysical) {
        dfMods.push(6144);
        desc.defenderAbility = defender.ability;
        desc.weather = field.weather;
    }
    if (field.hasTerrain('Grassy') && defender.hasAbility('Grass Pelt') && hitsPhysical) {
        dfMods.push(6144);
        desc.defenderAbility = defender.ability;
    }
    if ((!hitsPhysical && defender.hasItem('Soul Dew') &&
        defender.named('Latios', 'Latias', 'Latios-Mega', 'Latias-Mega')) ||
        (defender.hasItem('Eviolite') && ((_a = gen.species.get(util_1.toID(defender.name))) === null || _a === void 0 ? void 0 : _a.nfe)) ||
        (!hitsPhysical && defender.hasItem('Assault Vest'))) {
        dfMods.push(6144);
        desc.defenderItem = defender.item;
    }
    if ((defender.hasItem('Metal Powder') && defender.named('Ditto') && hitsPhysical) ||
        (defender.hasItem('Deep Sea Scale') && defender.named('Clamperl') && !hitsPhysical)) {
        dfMods.push(8192);
        desc.defenderItem = defender.item;
    }
    if (defender.hasAbility('Fur Coat') && hitsPhysical) {
        dfMods.push(8192);
        desc.defenderAbility = defender.ability;
    }
    defense = util_2.OF16(Math.max(1, util_2.pokeRound((defense * util_2.chainMods(dfMods)) / 4096)));
    var baseDamage = util_2.getBaseDamage(attacker.level, basePower, attack, defense);
    var isSpread = field.gameType !== 'Singles' &&
        ['allAdjacent', 'allAdjacentFoes'].includes(move.target);
    if (isSpread) {
        baseDamage = util_2.pokeRound(util_2.OF32(baseDamage * 3072) / 4096);
    }
    if (attacker.hasAbility('Parental Bond (Child)')) {
        baseDamage = util_2.pokeRound(util_2.OF32(baseDamage * 2048) / 4096);
    }
    if ((field.hasWeather('Sun', 'Harsh Sunshine') && move.hasType('Fire')) ||
        (field.hasWeather('Rain', 'Heavy Rain') && move.hasType('Water'))) {
        baseDamage = util_2.pokeRound(util_2.OF32(baseDamage * 6144) / 4096);
        desc.weather = field.weather;
    }
    else if ((field.hasWeather('Sun') && move.hasType('Water')) ||
        (field.hasWeather('Rain') && move.hasType('Fire'))) {
        baseDamage = util_2.pokeRound(util_2.OF32(baseDamage * 2048) / 4096);
        desc.weather = field.weather;
    }
    else if ((field.hasWeather('Harsh Sunshine') && move.hasType('Water')) ||
        (field.hasWeather('Heavy Rain') && move.hasType('Fire'))) {
        return result;
    }
    if (isCritical) {
        baseDamage = Math.floor(util_2.OF32(baseDamage * (gen.num > 5 ? 1.5 : 2)));
        desc.isCritical = isCritical;
    }
    var stabMod = 4096;
    if (attacker.hasType(move.type)) {
        if (attacker.hasAbility('Adaptability')) {
            stabMod = 8192;
            desc.attackerAbility = attacker.ability;
        }
        else {
            stabMod = 6144;
        }
    }
    else if (attacker.hasAbility('Protean')) {
        stabMod = 6144;
        desc.attackerAbility = attacker.ability;
    }
    var applyBurn = attacker.hasStatus('brn') &&
        move.category === 'Physical' &&
        !attacker.hasAbility('Guts') &&
        !(move.named('Facade') && gen.num === 6);
    desc.isBurned = applyBurn;
    var finalMods = [];
    if (field.defenderSide.isReflect && move.category === 'Physical' && !isCritical) {
        finalMods.push(field.gameType !== 'Singles' ? (gen.num > 5 ? 2732 : 2703) : 2048);
        desc.isReflect = true;
    }
    else if (field.defenderSide.isLightScreen && move.category === 'Special' && !isCritical) {
        finalMods.push(field.gameType !== 'Singles' ? (gen.num > 5 ? 2732 : 2703) : 2048);
        desc.isLightScreen = true;
    }
    if (defender.hasAbility('Multiscale') && defender.curHP() === defender.maxHP() &&
        !field.defenderSide.isSR && (!field.defenderSide.spikes || defender.hasType('Flying')) &&
        !attacker.hasAbility('Parental Bond (Child)')) {
        finalMods.push(2048);
        desc.defenderAbility = defender.ability;
    }
    if (attacker.hasAbility('Tinted Lens') && typeEffectiveness < 1) {
        finalMods.push(8192);
        desc.attackerAbility = attacker.ability;
    }
    if (field.defenderSide.isFriendGuard) {
        finalMods.push(3072);
        desc.isFriendGuard = true;
    }
    if (attacker.hasAbility('Sniper') && isCritical) {
        finalMods.push(6144);
        desc.attackerAbility = attacker.ability;
    }
    if (defender.hasAbility('Solid Rock', 'Filter') && typeEffectiveness > 1) {
        finalMods.push(3072);
        desc.defenderAbility = defender.ability;
    }
    if (attacker.hasItem('Metronome') && move.timesUsedWithMetronome >= 1) {
        var timesUsedWithMetronome = Math.floor(move.timesUsedWithMetronome);
        if (timesUsedWithMetronome <= 4) {
            finalMods.push(4096 + timesUsedWithMetronome * 819);
        }
        else {
            finalMods.push(8192);
        }
        desc.attackerItem = attacker.item;
    }
    if (attacker.hasItem('Expert Belt') && typeEffectiveness > 1 && !move.isZ) {
        finalMods.push(4915);
        desc.attackerItem = attacker.item;
    }
    else if (attacker.hasItem('Life Orb')) {
        finalMods.push(5324);
        desc.attackerItem = attacker.item;
    }
    if (move.hasType(items_1.getBerryResistType(defender.item)) &&
        (typeEffectiveness > 1 || move.hasType('Normal')) &&
        !attacker.hasAbility('Unnerve')) {
        finalMods.push(2048);
        desc.defenderItem = defender.item;
    }
    if (field.defenderSide.isProtected && move.isZ && attacker.item && attacker.item.includes(' Z')) {
        finalMods.push(1024);
        desc.isProtected = true;
    }
    var finalMod = util_2.chainMods(finalMods);
    var childDamage;
    if (attacker.hasAbility('Parental Bond') && move.hits === 1 && !isSpread) {
        var child = attacker.clone();
        child.ability = 'Parental Bond (Child)';
        util_2.checkMultihitBoost(gen, child, defender, move, field, desc);
        childDamage = calculateBWXY(gen, child, defender, move, field).damage;
        desc.attackerAbility = attacker.ability;
    }
    var damage = [];
    for (var i = 0; i < 16; i++) {
        damage[i] =
            util_2.getFinalDamage(baseDamage, i, typeEffectiveness, applyBurn, stabMod, finalMod);
    }
    if (move.dropsStats && (move.timesUsed || 0) > 1) {
        var simpleMultiplier = attacker.hasAbility('Simple') ? 2 : 1;
        desc.moveTurns = "over " + move.timesUsed + " turns";
        var hasWhiteHerb = attacker.hasItem('White Herb');
        var usedWhiteHerb = false;
        var dropCount = attacker.boosts[attackStat];
        var _loop_1 = function (times) {
            var newAttack = util_2.getModifiedStat(attack, dropCount);
            var damageMultiplier = 0;
            damage = damage.map(function (affectedAmount) {
                if (times) {
                    var newBaseDamage = util_2.getBaseDamage(attacker.level, basePower, newAttack, defense);
                    var newFinalDamage = util_2.getFinalDamage(newBaseDamage, damageMultiplier, typeEffectiveness, applyBurn, stabMod, finalMod);
                    damageMultiplier++;
                    return affectedAmount + newFinalDamage;
                }
                return affectedAmount;
            });
            if (attacker.hasAbility('Contrary')) {
                dropCount = Math.min(6, dropCount + move.dropsStats);
                desc.attackerAbility = attacker.ability;
            }
            else {
                dropCount = Math.max(-6, dropCount - move.dropsStats * simpleMultiplier);
                if (attacker.hasAbility('Simple')) {
                    desc.attackerAbility = attacker.ability;
                }
            }
            if (hasWhiteHerb && attacker.boosts[attackStat] < 0 && !usedWhiteHerb) {
                dropCount += move.dropsStats * simpleMultiplier;
                usedWhiteHerb = true;
                desc.attackerItem = attacker.item;
            }
        };
        for (var times = 0; times < move.timesUsed; times++) {
            _loop_1(times);
        }
    }
    desc.attackBoost =
        move.named('Foul Play') ? defender.boosts[attackStat] : attacker.boosts[attackStat];
    result.damage = childDamage ? [damage, childDamage] : damage;
    return result;
}
exports.calculateBWXY = calculateBWXY;
//# sourceMappingURL=gen56.js.map