import os
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import httpx
from urllib.parse import quote
from collections import Counter

load_dotenv()

app = FastAPI()

item_map = {}
rune_map = {}
champion_map = {}

RIOT_API_KEY = os.getenv("RIOT_API_KEY")
if not RIOT_API_KEY:
    raise RuntimeError("Chave da API da Riot não encontrada no arquivo .env")

REGION_TO_ACCOUNT_ROUTING = {
    "BR1": "americas", "NA1": "americas", "LA1": "americas", "LA2": "americas",
    "EUN1": "europe", "EUW1": "europe", "TR1": "europe", "RU": "europe",
    "JP1": "asia", "KR": "asia",
    "OC1": "sea",
}

async def load_game_data():
    global item_map, rune_map, champion_map
    async def load_items():
        ITEM_JSON_URL = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/items.json'
        CORRECT_BASE_IMAGE_URL = 'https://raw.communitydragon.org/latest/game/assets/items/icons2d/'
        print("Carregando items.json...")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(ITEM_JSON_URL)
                items = response.json()
                for item in items:
                    if 'id' in item and 'iconPath' in item and item['iconPath']:
                        filename_lower = item['iconPath'].split('/')[-1].lower()
                        item_map[item['id']] = f"{CORRECT_BASE_IMAGE_URL}{filename_lower}"
            print(f"{len(item_map)} itens carregados com sucesso!")
        except Exception as e:
            print(f"ERRO ao carregar items.json: {e}")

    async def load_runes():
        RUNE_JSON_URL = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perks.json'
        CORRECT_RUNE_BASE_URL = 'https://raw.communitydragon.org/latest/game/assets/perks/'
        
        print("Carregando perks.json (runas) com a lógica final corrigida...")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(RUNE_JSON_URL)
                response.raise_for_status()
                runes = response.json()
                
                path_prefix_to_remove = '/lol-game-data/assets/v1/perk-images/'

                for rune in runes:
                    if 'id' in rune and 'iconPath' in rune and rune['iconPath']:
                        
                        icon_path = rune['iconPath']
                        
                        relevant_path = icon_path.replace(path_prefix_to_remove, '')
                        
                        full_url = f"{CORRECT_RUNE_BASE_URL}{relevant_path}".lower()
                        rune_map[rune['id']] = full_url

            print(f"{len(rune_map)} runas carregadas com sucesso!")
        except Exception as e:
            print(f"ERRO ao carregar perks.json: {e}")

    async def load_champions():
        CHAMPION_JSON_URL = 'https://ddragon.leagueoflegends.com/cdn/14.9.1/data/en_US/champion.json'
        print("Carregando champion.json...")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(CHAMPION_JSON_URL)
                response.raise_for_status()
                champion_data = response.json()['data']
                
                for champ_name_key, champ_info in champion_data.items():
                    numeric_id = int(champ_info['key'])
                    champion_map[numeric_id] = champ_name_key 
            print(f"{len(champion_map)} campeões carregados com sucesso!")
        except Exception as e:
            print(f"ERRO ao carregar champion.json: {e}")

    await asyncio.gather(load_items(), load_runes(), load_champions())

async def ensure_data_loaded():
    if not champion_map:
        print("# DEBUG: Mapas de dados vazios. Iniciando carregamento...")
        await load_game_data()
    else:
        print("# DEBUG: Mapas de dados já em memória.")


async def get_champion_mastery(client: httpx.AsyncClient, region: str, puuid: str, headers: dict):
    url = f"https://{region.lower()}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}"
    try:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError:
        return [] 

async def determine_main_lane(client: httpx.AsyncClient, region_routing: str, puuid: str, headers: dict):
    try:
        match_ids_url = f"https://{region_routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?queue=420&count=15"
        match_ids_response = await client.get(match_ids_url, headers=headers)
        match_ids_response.raise_for_status()
        match_ids = match_ids_response.json()

        if not match_ids:
            return "N/A"

        tasks = []
        for match_id in match_ids[:5]:
            match_detail_url = f"https://{region_routing}.api.riotgames.com/lol/match/v5/matches/{match_id}"
            tasks.append(client.get(match_detail_url, headers=headers))
        
        match_details_responses = await asyncio.gather(*tasks)

        lanes = []
        for response in match_details_responses:
            if response.status_code == 200:
                match_data = response.json()
                for participant in match_data['info']['participants']:
                    if participant['puuid'] == puuid:
                        lanes.append(participant.get('individualPosition', 'UNKNOWN'))
                        break
        
        if not lanes:
            return "N/A"
            
        lane_counts = Counter(lanes)
        return lane_counts.most_common(1)[0][0]

    except httpx.HTTPStatusError:
        return "N/A" 


@app.get("/api/player/{region}")
async def get_player_data(region: str, game_name: str, tag_line: str):
    await ensure_data_loaded()
    if region.upper() not in REGION_TO_ACCOUNT_ROUTING:
        raise HTTPException(status_code=400, detail="Região inválida.")

    safe_game_name = quote(game_name)
    safe_tag_line = quote(tag_line)

    account_routing = REGION_TO_ACCOUNT_ROUTING[region.upper()]
    api_headers = {"X-Riot-Token": RIOT_API_KEY}

    async with httpx.AsyncClient() as client:
        try:
            account_url = f"https://{account_routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{safe_game_name}/{safe_tag_line}"
            account_response = await client.get(account_url, headers=api_headers)
            if account_response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"O Riot ID '{game_name}#{tag_line}' não foi encontrado.")
            account_response.raise_for_status()
            account_data = account_response.json()
            puuid = account_data['puuid']

            summoner_url = f"https://{region.lower()}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{puuid}"
            summoner_response = await client.get(summoner_url, headers=api_headers)
            if summoner_response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"O jogador existe, mas não possui perfil de LoL na região {region.upper()}.")
            summoner_response.raise_for_status()
            summoner_data = summoner_response.json()

            league_url = f"https://{region.lower()}.api.riotgames.com/lol/league/v4/entries/by-puuid/{puuid}"
            league_response = await client.get(league_url, headers=api_headers)
            league_response.raise_for_status()
            league_data = league_response.json()

            return {
                "account": account_data,
                "summoner": summoner_data,
                "league": league_data
            }

        except HTTPException as e:
            raise e 
        except httpx.HTTPStatusError as e:
            error_details = e.response.json().get('status', {})
            error_message = error_details.get('message', 'Erro desconhecido da API da Riot')
            raise HTTPException(status_code=e.response.status_code, detail=error_message)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro interno no servidor: {str(e)}")


@app.get("/api/player-details/{region}")
async def get_player_details(region: str, game_name: str, tag_line: str):
    await ensure_data_loaded()
    if region.upper() not in REGION_TO_ACCOUNT_ROUTING:
        raise HTTPException(status_code=400, detail="Região inválida.")

    safe_game_name = quote(game_name)
    safe_tag_line = quote(tag_line)

    account_routing = REGION_TO_ACCOUNT_ROUTING[region.upper()]
    api_headers = {"X-Riot-Token": RIOT_API_KEY}

    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            account_url = f"https://{account_routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{safe_game_name}/{safe_tag_line}"
            account_response = await client.get(account_url, headers=api_headers)
            if account_response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"O Riot ID '{game_name}#{tag_line}' não foi encontrado.")
            account_response.raise_for_status()
            account_data = account_response.json()
            puuid = account_data['puuid']

            summoner_url = f"https://{region.lower()}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{puuid}"
            league_url = f"https://{region.lower()}.api.riotgames.com/lol/league/v4/entries/by-puuid/{puuid}"
            
            results = await asyncio.gather(
                client.get(summoner_url, headers=api_headers),
                client.get(league_url, headers=api_headers),
                get_champion_mastery(client, region, puuid, api_headers),
                determine_main_lane(client, account_routing, puuid, api_headers),
            )
            
            summoner_response, league_response, mastery_data, main_lane = results

            if summoner_response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"O jogador existe, mas não possui perfil de LoL na região {region.upper()}.")
            
            summoner_response.raise_for_status()
            league_response.raise_for_status()

            main_champion_key = None
            if mastery_data:
                main_champion_id = mastery_data[0]['championId']
                main_champion_key = champion_map.get(main_champion_id)

            return {
                "account": account_data,
                "summoner": summoner_response.json(),
                "league": league_response.json(),
                "championMastery": mastery_data,
                "mainLane": main_lane,
                "mainChampionKey": main_champion_key
            }

        except HTTPException as e:
            raise e
        except httpx.RequestError as e:
            raise HTTPException(status_code=504, detail=f"Erro de comunicação com a API da Riot: {e}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro interno no servidor: {str(e)}")

@app.get("/api/match-history/{region_routing}/{puuid}")
async def get_match_history(region_routing: str, puuid: str):
    await ensure_data_loaded()  
    print(f"# DEBUG: Mapas ANTES de usar no histórico: Champions={len(champion_map)}, Itens={len(item_map)}, Runas={len(rune_map)}")
    api_headers = {"X-Riot-Token": RIOT_API_KEY}
    
    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            match_ids_url = f"https://{region_routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/{puuid}/ids?count=10"
            match_ids_response = await client.get(match_ids_url, headers=api_headers)
            match_ids_response.raise_for_status()
            match_ids = match_ids_response.json()

            if not match_ids:
                return []

            tasks = [client.get(f"https://{region_routing}.api.riotgames.com/lol/match/v5/matches/{match_id}", headers=api_headers) for match_id in match_ids]
            match_details_responses = await asyncio.gather(*tasks)
            
            simplified_matches = []
            for response in match_details_responses:
                if response.status_code == 200:
                    match_data = response.json()
                    info = match_data['info']
                    
                    player_data = next((p for p in info['participants'] if p['puuid'] == puuid), None)
                    if not player_data:
                        continue

                    runes_data = player_data.get('perks', {}).get('styles', [])
                    primary_rune_id = None
                    secondary_style_id = None
                    if len(runes_data) > 0 and len(runes_data[0].get('selections', [])) > 0:
                        primary_rune_id = runes_data[0]['selections'][0]['perk']
                    if len(runes_data) > 1:
                        secondary_style_id = runes_data[1]['style']

                    all_players = []
                    for participant in info['participants']:
                        all_players.append({
                            "gameName": participant.get('riotIdGameName', 'Player Not Found'),
                            "tagLine": participant.get('riotIdTagline', ''),
                            "championId": participant['championId'],
                            "teamId": participant['teamId'],
                        })
                        
                    simplified_match = {
                        "matchId": match_data['metadata']['matchId'],
                        "win": player_data['win'],
                        "gameDuration": info['gameDuration'],
                        "gameEndTimestamp": info.get('gameEndTimestamp', 0),
                        "queueId": info['queueId'],
                        "championId": player_data['championId'],
                        "championName": player_data['championName'],
                        "kills": player_data['kills'],
                        "deaths": player_data['deaths'],
                        "assists": player_data['assists'],
                        "summoner1Id": player_data['summoner1Id'],
                        "summoner2Id": player_data['summoner2Id'],
                        "itemUrls": [item_map.get(player_data[f'item{i}']) for i in range(7)],
                        "runes": {
                            "primaryRuneUrl": rune_map.get(primary_rune_id),
                            "secondaryStyleUrl": rune_map.get(secondary_style_id)
                        },
                        "allPlayers": all_players
                    }
                    simplified_matches.append(simplified_match)

            return simplified_matches

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return []
            raise HTTPException(status_code=e.response.status_code, detail="Erro ao buscar histórico da Riot API.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro interno no servidor: {str(e)}")