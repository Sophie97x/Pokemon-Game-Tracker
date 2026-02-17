-- Create tables for Pokemon tracking system

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  generation INT NOT NULL,
  release_year INT NOT NULL,
  platform VARCHAR(50) NOT NULL,
  completion_time_hours INT NOT NULL,
  description TEXT,
  recommended_order INT NOT NULL,
  save_file_format VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Game content items (gyms, side missions, etc.)
CREATE TABLE IF NOT EXISTS game_content (
  id SERIAL PRIMARY KEY,
  game_id INT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL, -- 'gym', 'side_mission', 'pokemon_catch', 'story_chapter'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  order_num INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  game_id INT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed', 'paused'
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  save_file_path VARCHAR(512),
  save_file_imported BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, game_id)
);

-- Game content tracker (tracks which items are completed)
CREATE TABLE IF NOT EXISTS game_content_tracker (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  game_id INT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  content_id INT NOT NULL REFERENCES game_content(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, content_id)
);

-- Create indexes
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_game_id ON user_progress(game_id);
CREATE INDEX idx_game_content_tracker_user_id ON game_content_tracker(user_id);
CREATE INDEX idx_game_content_tracker_game_id ON game_content_tracker(game_id);

-- Insert Pokemon games data
INSERT INTO games (name, generation, release_year, platform, completion_time_hours, description, recommended_order, save_file_format) VALUES
('Pokémon Red', 1, 1996, 'Game Boy', 25, 'The original Pokémon adventure that started it all!', 1, 'SAV'),
('Pokémon Blue', 1, 1996, 'Game Boy', 25, 'Red version counterpart with different Pokémon', 2, 'SAV'),
('Pokémon Yellow', 1, 1998, 'Game Boy', 30, 'Follow Ash''s journey from the anime series', 3, 'SAV'),
('Pokémon Gold', 2, 1999, 'Game Boy Color', 30, 'Journey through Johto region', 4, 'SAV'),
('Pokémon Silver', 2, 1999, 'Game Boy Color', 30, 'Silver version with different legendaries', 5, 'SAV'),
('Pokémon Crystal', 2, 2000, 'Game Boy Color', 35, 'Enhanced Gold/Silver with Suicune quest', 6, 'SAV'),
('Pokémon Ruby', 3, 2002, 'Game Boy Advance', 30, 'Explore the Hoenn region', 7, 'SAV'),
('Pokémon Sapphire', 3, 2002, 'Game Boy Advance', 30, 'Sapphire version with Kyogre', 8, 'SAV'),
('Pokémon Emerald', 3, 2004, 'Game Boy Advance', 35, 'Enhanced Ruby/Sapphire experience', 9, 'SAV'),
('Pokémon FireRed', 3, 2004, 'Game Boy Advance', 30, 'Remake of Pokémon Red', 10, 'SAV'),
('Pokémon LeafGreen', 3, 2004, 'Game Boy Advance', 30, 'Remake of Pokémon Blue', 11, 'SAV'),
('Pokémon Diamond', 4, 2006, 'Nintendo DS', 35, 'Explore the Sinnoh region', 12, 'SAV'),
('Pokémon Pearl', 4, 2006, 'Nintendo DS', 35, 'Pearl version with Palkia', 13, 'SAV'),
('Pokémon Platinum', 4, 2008, 'Nintendo DS', 40, 'Enhanced Diamond/Pearl with Giratina', 14, 'SAV'),
('Pokémon HeartGold', 4, 2009, 'Nintendo DS', 35, 'Remake of Pokémon Gold', 15, 'SAV'),
('Pokémon SoulSilver', 4, 2009, 'Nintendo DS', 35, 'Remake of Pokémon Silver', 16, 'SAV'),
('Pokémon Black', 5, 2010, 'Nintendo DS', 30, 'Unova region adventure', 17, 'SAV'),
('Pokémon White', 5, 2010, 'Nintendo DS', 30, 'White version with Reshiram', 18, 'SAV'),
('Pokémon Black 2', 5, 2012, 'Nintendo DS', 35, 'Sequel set in Unova', 19, 'SAV'),
('Pokémon White 2', 5, 2012, 'Nintendo DS', 35, 'Black 2 counterpart', 20, 'SAV'),
('Pokémon X', 6, 2013, 'Nintendo 3DS', 30, 'Explore the Kalos region', 21, '3DS'),
('Pokémon Y', 6, 2013, 'Nintendo 3DS', 30, 'Y version with Yveltal', 22, '3DS'),
('Pokémon Omega Ruby', 6, 2014, 'Nintendo 3DS', 35, '3D remake of Ruby', 23, '3DS'),
('Pokémon Alpha Sapphire', 6, 2014, 'Nintendo 3DS', 35, '3D remake of Sapphire', 24, '3DS'),
('Pokémon Sun', 7, 2016, 'Nintendo 3DS', 35, 'Alola region adventure', 25, '3DS'),
('Pokémon Moon', 7, 2016, 'Nintendo 3DS', 35, 'Moon version with different legendaries', 26, '3DS'),
('Pokémon Ultra Sun', 7, 2017, 'Nintendo 3DS', 40, 'Enhanced Sun/Moon experience', 27, '3DS'),
('Pokémon Ultra Moon', 7, 2017, 'Nintendo 3DS', 40, 'Enhanced Moon experience', 28, '3DS'),
('Pokémon Sword', 8, 2019, 'Nintendo Switch', 35, 'Explore the Galar region', 29, 'Switch'),
('Pokémon Shield', 8, 2019, 'Nintendo Switch', 35, 'Shield version experience', 30, 'Switch'),
('Pokémon Legends: Arceus', 8, 2022, 'Nintendo Switch', 30, 'Action-RPG in ancient Sinnoh', 31, 'Switch'),
('Pokémon Brilliant Diamond', 8, 2021, 'Nintendo Switch', 30, 'Remake of Diamond', 32, 'Switch'),
('Pokémon Shining Pearl', 8, 2021, 'Nintendo Switch', 30, 'Remake of Pearl', 33, 'Switch'),
('Pokémon Scarlet', 9, 2022, 'Nintendo Switch', 40, 'Open-world Paldea region', 34, 'Switch'),
('Pokémon Violet', 9, 2022, 'Nintendo Switch', 40, 'Violet version of Paldea', 35, 'Switch'),
('Pokémon Legends: Z-A', 9, 2025, 'Nintendo Switch', 30, 'Action RPG in Kalos', 36, 'Switch');

-- Insert content items for some games (examples)
INSERT INTO game_content (game_id, content_type, name, description, order_num) VALUES
(1, 'gym', 'Brock''s Gym', 'Rock-type Gym Leader', 1),
(1, 'gym', 'Misty''s Gym', 'Water-type Gym Leader', 2),
(1, 'gym', 'Lt. Surge''s Gym', 'Electric-type Gym Leader', 3),
(1, 'gym', 'Erika''s Gym', 'Grass-type Gym Leader', 4),
(1, 'gym', 'Koga''s Gym', 'Poison-type Gym Leader', 5),
(1, 'gym', 'Sabrina''s Gym', 'Psychic-type Gym Leader', 6),
(1, 'gym', 'Blaine''s Gym', 'Fire-type Gym Leader', 7),
(1, 'gym', 'Giovanni''s Gym', 'Ground-type Gym Leader', 8),
(1, 'story_chapter', 'Starting the Journey', 'Choose your starter Pokémon', 1),
(1, 'story_chapter', 'Defeat Team Rocket', 'Complete main storyline', 2),
(1, 'pokemon_catch', 'Catch all Gen 1 Pokémon', 'Complete the Pokedex', 1),
(1, 'side_mission', 'Help NPCs', 'Assist various characters', 1);

-- Pokémon Emerald content (game_id = 9)
INSERT INTO game_content (game_id, content_type, name, description, order_num) VALUES
(9, 'gym', 'Roxie''s Gym', 'Rock-type Gym Leader in Rustboro', 1),
(9, 'gym', 'Brawley''s Gym', 'Fighting-type Gym Leader in Dewford', 2),
(9, 'gym', 'Watson''s Gym', 'Electric-type Gym Leader in Mauville', 3),
(9, 'gym', 'Flannery''s Gym', 'Fire-type Gym Leader in Lavaridge', 4),
(9, 'gym', 'Norman''s Gym', 'Normal-type Gym Leader in Petalburg', 5),
(9, 'gym', 'Winona''s Gym', 'Flying-type Gym Leader in Fortree', 6),
(9, 'gym', 'Tate & Liza''s Gym', 'Psychic-type Gym Leader Twins in Mossdeep', 7),
(9, 'gym', 'Wallace''s Gym', 'Water-type Gym Leader in Sootopolis', 8);
