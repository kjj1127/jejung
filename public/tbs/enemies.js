/* enemies.js - 적 데이터 */
const enemiesData = [
    // 1~4층: 초급 몬스터
    { "floor": 1, "name": "슬라임", "hp": 50, "maxHp": 50, "mp": 5, "maxMp": 5, "atk": 18, "crit": 0, "avoid": 0, "speed": 5, "hpRegen": 3, "mpRegen": 1 },
    { "floor": 2, "name": "쥐", "hp": 60, "maxHp": 60, "mp": 5, "maxMp": 5, "atk": 20, "crit": 5, "avoid": 5, "speed": 8, "hpRegen": 3, "mpRegen": 1 },
    { "floor": 3, "name": "박쥐", "hp": 70, "maxHp": 70, "mp": 5, "maxMp": 5, "atk": 22, "crit": 5, "avoid": 10, "speed": 12, "hpRegen": 3, "mpRegen": 1 },
    { "floor": 4, "name": "들개", "hp": 85, "maxHp": 85, "mp": 5, "maxMp": 5, "atk": 24, "crit": 10, "avoid": 5, "speed": 10, "hpRegen": 2, "mpRegen": 1 },
    
    // 5층: 중간 보스 (오크)
    { "floor": 5, "name": "오크 대장", "hp": 150, "maxHp": 150, "mp": 20, "maxMp": 20, "atk": 26, "crit": 10, "avoid": 0, "speed": 8, "hpRegen": 5, "mpRegen": 1 },

    // 6~9층: 중급 몬스터
    { "floor": 6, "name": "고블린", "hp": 100, "maxHp": 100, "mp": 10, "maxMp": 10, "atk": 24, "crit": 5, "avoid": 10, "speed": 15, "hpRegen": 2, "mpRegen": 1 },
    { "floor": 7, "name": "스켈레톤", "hp": 110, "maxHp": 110, "mp": 5, "maxMp": 5, "atk": 26, "crit": 15, "avoid": 5, "speed": 11, "hpRegen": 3, "mpRegen": 1 },
    { "floor": 8, "name": "좀비", "hp": 140, "maxHp": 140, "mp": 10, "maxMp": 10, "atk": 27, "crit": 0, "avoid": 0, "speed": 5, "hpRegen": 10, "mpRegen": 2 },
    { "floor": 9, "name": "하피", "hp": 120, "maxHp": 120, "mp": 20, "maxMp": 20, "atk": 28, "crit": 10, "avoid": 20, "speed": 20, "hpRegen": 3, "mpRegen": 2 },

    // 10층: 중간 보스 (트롤)
    { "floor": 10, "name": "트롤", "hp": 300, "maxHp": 300, "mp": 30, "maxMp": 30, "atk": 40, "crit": 5, "avoid": 5, "speed": 10, "hpRegen": 10, "mpRegen": 2 },

    // 11~14층: 상급 몬스터
    { "floor": 11, "name": "다크 엘프", "hp": 180, "maxHp": 180, "mp": 50, "maxMp": 50, "atk": 35, "crit": 20, "avoid": 15, "speed": 25, "hpRegen": 5, "mpRegen": 5 },
    { "floor": 12, "name": "웨어울프", "hp": 200, "maxHp": 200, "mp": 20, "maxMp": 20, "atk": 45, "crit": 25, "avoid": 10, "speed": 22, "hpRegen": 10, "mpRegen": 1 },
    { "floor": 13, "name": "가고일", "hp": 250, "maxHp": 250, "mp": 5, "maxMp": 5, "atk": 30, "crit": 5, "avoid": 5, "speed": 12, "hpRegen": 5, "mpRegen": 1 },
    { "floor": 14, "name": "흑마법사", "hp": 160, "maxHp": 160, "mp": 100, "maxMp": 100, "atk": 50, "crit": 10, "avoid": 5, "speed": 18, "hpRegen": 5, "mpRegen": 10 },

    // 15층: 중간 보스 (골렘)
    { "floor": 15, "name": "아이언 골렘", "hp": 500, "maxHp": 500, "mp": 5, "maxMp": 5, "atk": 60, "crit": 0, "avoid": 0, "speed": 5, "hpRegen": 3, "mpRegen": 1 },

    // 16~19층: 정예 몬스터
    { "floor": 16, "name": "듀라한", "hp": 300, "maxHp": 300, "mp": 40, "maxMp": 40, "atk": 55, "crit": 15, "avoid": 10, "speed": 20, "hpRegen": 10, "mpRegen": 2 },
    { "floor": 17, "name": "뱀파이어", "hp": 280, "maxHp": 280, "mp": 80, "maxMp": 80, "atk": 45, "crit": 20, "avoid": 20, "speed": 28, "hpRegen": 20, "mpRegen": 5 },
    { "floor": 18, "name": "리치", "hp": 250, "maxHp": 250, "mp": 200, "maxMp": 200, "atk": 70, "crit": 10, "avoid": 10, "speed": 15, "hpRegen": 15, "mpRegen": 10 },
    { "floor": 19, "name": "드래곤 헤들링", "hp": 450, "maxHp": 450, "mp": 100, "maxMp": 100, "atk": 80, "crit": 15, "avoid": 5, "speed": 30, "hpRegen": 10, "mpRegen": 5 },

    // 20층: 최종 보스 (마왕)
    { "floor": 20, "name": "마왕", "hp": 800, "maxHp": 800, "mp": 100, "maxMp": 100, "atk": 90, "crit": 20, "avoid": 10, "speed": 35, "hpRegen": 30, "mpRegen": 7 }
];