"""Exotic Care Guide (Etapa 29): conteudo estatico por especie + PDF.

O conteudo vive AQUI (backend) — o frontend so consome a API (regra 7 do
CLAUDE.md) e traduz as tip_keys por i18n; o PDF v1 e ingles (TIP_TEXTS_EN).
Conteudo orientativo de manejo/bem-estar — regra 5: nunca diagnostico nem
prescricao; warning_signs sempre orienta procurar um vet de exoticos.
"""
import io

from fastapi import HTTPException, status
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import simpleSplit
from reportlab.pdfgen import canvas

from app.core.supabase import get_service_client
from app.schemas.auth import CurrentUser
from app.schemas.care_guide import CareGuideResponse, CareGuideSection

# Identidade visual TALOA (mesmos tons do card_service / travel_service).
BRAND = HexColor("#1A3A5C")
MUTED = HexColor("#64748B")
INK = HexColor("#1F2937")

EXOTIC_SPECIES = {"reptile", "bird", "rabbit", "small_mammal", "fish", "other"}

SECTIONS = [
    "habitat", "feeding", "environment", "handling",
    "hygiene", "enrichment", "warning_signs",
]

SECTION_TITLES_EN = {
    "habitat": "Habitat",
    "feeding": "Feeding",
    "environment": "Environment",
    "handling": "Handling",
    "hygiene": "Hygiene",
    "enrichment": "Enrichment",
    "warning_signs": "Warning signs",
}

# ── Guias por especie ────────────────────────────────────────
# CARE_GUIDES[species][section] = [tip_keys] (7 secoes fixas, 3-5 dicas cada).
CARE_GUIDES: dict[str, dict[str, list[str]]] = {
    "reptile": {
        "habitat": [
            "reptile_habitat_secure", "reptile_habitat_size",
            "reptile_habitat_hides", "reptile_habitat_substrate",
        ],
        "feeding": [
            "reptile_feeding_research", "reptile_feeding_supplements",
            "reptile_feeding_water", "reptile_feeding_live_prey",
        ],
        "environment": [
            "reptile_env_temp_gradient", "reptile_env_thermostat",
            "reptile_env_uvb", "reptile_env_humidity", "reptile_env_no_direct_sun",
        ],
        "handling": [
            "reptile_handling_support", "reptile_handling_hygiene",
            "reptile_handling_short", "reptile_handling_avoid_after_feeding",
        ],
        "hygiene": [
            "reptile_hygiene_spot_clean", "reptile_hygiene_disinfect",
            "reptile_hygiene_hands", "reptile_hygiene_quarantine",
        ],
        "enrichment": [
            "reptile_enrichment_climbing", "reptile_enrichment_rearrange",
            "reptile_enrichment_feeding_variety", "reptile_enrichment_digging",
        ],
        "warning_signs": [
            "reptile_warning_appetite", "reptile_warning_shed",
            "reptile_warning_lethargy", "reptile_warning_find_vet",
        ],
    },
    "bird": {
        "habitat": [
            "bird_habitat_cage_size", "bird_habitat_perches",
            "bird_habitat_location", "bird_habitat_liner",
        ],
        "feeding": [
            "bird_feeding_pellets", "bird_feeding_toxic_foods",
            "bird_feeding_water", "bird_feeding_seed_limit",
        ],
        "environment": [
            "bird_env_temperature", "bird_env_light",
            "bird_env_sleep", "bird_env_fumes",
        ],
        "handling": [
            "bird_handling_trust", "bird_handling_support",
            "bird_handling_supervise", "bird_handling_room_hazards",
        ],
        "hygiene": [
            "bird_hygiene_cage", "bird_hygiene_bathing",
            "bird_hygiene_nails_beak", "bird_hygiene_hands",
        ],
        "enrichment": [
            "bird_enrichment_foraging", "bird_enrichment_rotate",
            "bird_enrichment_social", "bird_enrichment_shredding",
        ],
        "warning_signs": [
            "bird_warning_fluffed", "bird_warning_droppings",
            "bird_warning_breathing", "bird_warning_hiding_illness",
        ],
    },
    "rabbit": {
        "habitat": [
            "rabbit_habitat_space", "rabbit_habitat_hideout",
            "rabbit_habitat_proofing", "rabbit_habitat_flooring",
        ],
        "feeding": [
            "rabbit_feeding_hay", "rabbit_feeding_greens",
            "rabbit_feeding_pellets", "rabbit_feeding_gradual_changes",
        ],
        "environment": [
            "rabbit_env_heat", "rabbit_env_ventilation",
            "rabbit_env_predators", "rabbit_env_routine",
        ],
        "handling": [
            "rabbit_handling_hindquarters", "rabbit_handling_never_ears",
            "rabbit_handling_ground", "rabbit_handling_stress",
        ],
        "hygiene": [
            "rabbit_hygiene_litter", "rabbit_hygiene_flystrike",
            "rabbit_hygiene_nails", "rabbit_hygiene_brushing",
        ],
        "enrichment": [
            "rabbit_enrichment_tunnels", "rabbit_enrichment_chew",
            "rabbit_enrichment_companion", "rabbit_enrichment_forage",
        ],
        "warning_signs": [
            "rabbit_warning_stasis", "rabbit_warning_dirty_rear",
            "rabbit_warning_head_tilt", "rabbit_warning_teeth",
        ],
    },
    "small_mammal": {
        "habitat": [
            "small_mammal_habitat_cage", "small_mammal_habitat_bedding",
            "small_mammal_habitat_hideouts", "small_mammal_habitat_social",
        ],
        "feeding": [
            "small_mammal_feeding_base_diet", "small_mammal_feeding_hay_vitc",
            "small_mammal_feeding_water", "small_mammal_feeding_treats",
        ],
        "environment": [
            "small_mammal_env_sun_drafts", "small_mammal_env_temperature",
            "small_mammal_env_quiet", "small_mammal_env_ventilation",
        ],
        "handling": [
            "small_mammal_handling_scoop", "small_mammal_handling_taming",
            "small_mammal_handling_children", "small_mammal_handling_escapes",
        ],
        "hygiene": [
            "small_mammal_hygiene_bedding", "small_mammal_hygiene_bottles",
            "small_mammal_hygiene_teeth_nails", "small_mammal_hygiene_hands",
        ],
        "enrichment": [
            "small_mammal_enrichment_wheel", "small_mammal_enrichment_chew",
            "small_mammal_enrichment_tunnels", "small_mammal_enrichment_scatter",
        ],
        "warning_signs": [
            "small_mammal_warning_lethargy", "small_mammal_warning_digestion",
            "small_mammal_warning_breathing", "small_mammal_warning_fast_decline",
        ],
    },
    "fish": {
        "habitat": [
            "fish_habitat_tank_size", "fish_habitat_cycling",
            "fish_habitat_filtration", "fish_habitat_tank_mates",
        ],
        "feeding": [
            "fish_feeding_small_amounts", "fish_feeding_remove_uneaten",
            "fish_feeding_variety", "fish_feeding_no_overfeed",
        ],
        "environment": [
            "fish_env_water_testing", "fish_env_water_changes",
            "fish_env_dechlorinate", "fish_env_temperature",
        ],
        "handling": [
            "fish_handling_minimize", "fish_handling_soft_net",
            "fish_handling_acclimate", "fish_handling_tap_water",
        ],
        "hygiene": [
            "fish_hygiene_filter_media", "fish_hygiene_algae",
            "fish_hygiene_substrate", "fish_hygiene_quarantine",
        ],
        "enrichment": [
            "fish_enrichment_plants", "fish_enrichment_mates",
            "fish_enrichment_decor", "fish_enrichment_current",
        ],
        "warning_signs": [
            "fish_warning_gasping", "fish_warning_fins_spots",
            "fish_warning_appetite", "fish_warning_test_and_vet",
        ],
    },
    "other": {
        "habitat": [
            "other_habitat_research", "other_habitat_secure",
            "other_habitat_size", "other_habitat_substrate",
        ],
        "feeding": [
            "other_feeding_research", "other_feeding_water",
            "other_feeding_human_food", "other_feeding_schedule",
        ],
        "environment": [
            "other_env_research", "other_env_measure",
            "other_env_sun_drafts", "other_env_stability",
        ],
        "handling": [
            "other_handling_research", "other_handling_hands",
            "other_handling_short", "other_handling_stress",
        ],
        "hygiene": [
            "other_hygiene_routine", "other_hygiene_safe_products",
            "other_hygiene_quarantine", "other_hygiene_hands",
        ],
        "enrichment": [
            "other_enrichment_research", "other_enrichment_rotate",
            "other_enrichment_natural_behaviour", "other_enrichment_food",
        ],
        "warning_signs": [
            "other_warning_changes", "other_warning_find_vet",
            "other_warning_when_unsure", "other_warning_no_self_treatment",
        ],
    },
}

# Texto canonico EN de cada tip_key (fonte do PDF; o frontend traduz por i18n).
TIP_TEXTS_EN: dict[str, str] = {
    # ── reptile ──
    "reptile_habitat_secure": "Use a secure, escape-proof enclosure with a locking lid — reptiles are skilled escape artists.",
    "reptile_habitat_size": "Size the enclosure for your reptile's adult size, not the size it is today.",
    "reptile_habitat_hides": "Provide at least two hides: one on the warm side and one on the cool side.",
    "reptile_habitat_substrate": "Choose a substrate that is safe for your species — avoid loose substrates that can cause impaction in young reptiles.",
    "reptile_feeding_research": "Research your species' exact diet — insectivore, herbivore, carnivore or omnivore — from reliable sources.",
    "reptile_feeding_supplements": "Dust feeder insects with calcium and vitamin supplements as recommended by an exotics vet.",
    "reptile_feeding_water": "Keep fresh water available at all times, even for desert species.",
    "reptile_feeding_live_prey": "Never leave uneaten live prey in the enclosure — it can injure your reptile.",
    "reptile_env_temp_gradient": "Create a temperature gradient with a warm basking side and a cooler side so your reptile can self-regulate.",
    "reptile_env_thermostat": "Always control heat sources with a thermostat and check temperatures with a reliable thermometer.",
    "reptile_env_uvb": "Provide UVB lighting appropriate for your species and replace bulbs on schedule — output fades before the light dies.",
    "reptile_env_humidity": "Monitor humidity with a hygrometer and keep it in your species' ideal range.",
    "reptile_env_no_direct_sun": "Never place a closed enclosure in direct sunlight — it can overheat fatally in minutes.",
    "reptile_handling_support": "Support the whole body when handling — never grab a reptile by the tail.",
    "reptile_handling_hygiene": "Wash your hands before and after handling — reptiles can carry salmonella.",
    "reptile_handling_short": "Keep handling sessions short and calm, especially with new or young animals.",
    "reptile_handling_avoid_after_feeding": "Avoid handling right after feeding or during shedding.",
    "reptile_hygiene_spot_clean": "Spot-clean droppings daily and do a full substrate change on a regular schedule.",
    "reptile_hygiene_disinfect": "Disinfect the enclosure and decor with reptile-safe products only.",
    "reptile_hygiene_hands": "Good hand hygiene protects both you and your reptile.",
    "reptile_hygiene_quarantine": "Quarantine any new reptile away from existing animals before introducing them.",
    "reptile_enrichment_climbing": "Add climbing branches, rocks and textures suited to your species.",
    "reptile_enrichment_rearrange": "Occasionally rearrange decor to encourage exploration.",
    "reptile_enrichment_feeding_variety": "Vary how you offer food — tongs, scatter or puzzle feeding — to encourage natural behaviour.",
    "reptile_enrichment_digging": "Offer a digging area if burrowing is natural for your species.",
    "reptile_warning_appetite": "Watch for prolonged loss of appetite or weight loss — note it down and mention it to your vet.",
    "reptile_warning_shed": "Stuck shed, especially around eyes and toes, needs attention — ask an exotics vet for guidance.",
    "reptile_warning_lethargy": "Unusual lethargy, swelling, discharge or abnormal droppings are reasons to book an exotics vet visit.",
    "reptile_warning_find_vet": "Find a reptile-experienced exotics vet BEFORE you need one — they are rarer than dog and cat vets.",
    # ── bird ──
    "bird_habitat_cage_size": "Choose the largest cage you can — wide enough to stretch both wings — with safe bar spacing for your species.",
    "bird_habitat_perches": "Offer natural wood perches in varied diameters to keep feet healthy.",
    "bird_habitat_location": "Place the cage in a social room but away from the kitchen, drafts and direct sun.",
    "bird_habitat_liner": "Use a cage grate or paper liner you can change easily every day.",
    "bird_feeding_pellets": "Feed a quality pellet base plus fresh vegetables daily — seeds alone are not a complete diet.",
    "bird_feeding_toxic_foods": "Never feed avocado, chocolate, caffeine or alcohol — they are toxic to birds.",
    "bird_feeding_water": "Refresh drinking water at least twice a day.",
    "bird_feeding_seed_limit": "Keep seeds and treats to a small share of the diet to avoid obesity.",
    "bird_env_temperature": "Keep the room temperature stable and away from drafts and radiators.",
    "bird_env_light": "Provide natural daylight or full-spectrum lighting during the day.",
    "bird_env_sleep": "Give your bird 10-12 hours of dark, quiet sleep — cover the cage if needed.",
    "bird_env_fumes": "Never use non-stick cookware (PTFE), aerosols or scented candles near birds — the fumes can be fatal.",
    "bird_handling_trust": "Build trust gradually with short, positive training sessions — never force interaction.",
    "bird_handling_support": "Hold gently supporting the body — never squeeze a bird's chest.",
    "bird_handling_supervise": "Supervise all out-of-cage time in a bird-proofed room.",
    "bird_handling_room_hazards": "Before free flight, check windows, mirrors, ceiling fans, open water and other pets.",
    "bird_hygiene_cage": "Clean perches, bowls and the cage floor regularly.",
    "bird_hygiene_bathing": "Offer regular baths or gentle misting — most birds love it.",
    "bird_hygiene_nails_beak": "Have nails and beak checked by an avian or exotics vet rather than trimming at home.",
    "bird_hygiene_hands": "Wash your hands before and after handling your bird.",
    "bird_enrichment_foraging": "Use foraging toys so your bird works for food like it would in the wild.",
    "bird_enrichment_rotate": "Rotate toys weekly to keep the cage interesting.",
    "bird_enrichment_social": "Spend social time daily — birds are flock animals and loneliness causes stress.",
    "bird_enrichment_shredding": "Provide safe paper or soft wood items to shred.",
    "bird_warning_fluffed": "A bird sitting fluffed up at the bottom of the cage needs a vet — do not wait.",
    "bird_warning_droppings": "Persistent changes in droppings are worth a call to an avian or exotics vet.",
    "bird_warning_breathing": "Tail bobbing while breathing or breathing effort is an emergency — contact a vet immediately.",
    "bird_warning_hiding_illness": "Birds instinctively hide illness — by the time they look sick they need a vet urgently.",
    # ── rabbit ──
    "rabbit_habitat_space": "Give enough space to take at least three full hops in a row and stand upright on hind legs.",
    "rabbit_habitat_hideout": "Provide a hideout where your rabbit can retreat and feel safe.",
    "rabbit_habitat_proofing": "Rabbit-proof cables, skirting boards and toxic houseplants in any free-roam area.",
    "rabbit_habitat_flooring": "Use soft, non-slip flooring — wire floors hurt rabbits' feet.",
    "rabbit_feeding_hay": "Unlimited fresh hay should be about 85% of the diet — it keeps teeth and gut healthy.",
    "rabbit_feeding_greens": "Offer a variety of fresh leafy greens daily.",
    "rabbit_feeding_pellets": "Measure pellets — a small daily portion, not free-fed.",
    "rabbit_feeding_gradual_changes": "Change any food gradually over 1-2 weeks — sudden changes upset the gut.",
    "rabbit_env_heat": "Keep your rabbit cool — temperatures above 25°C risk heatstroke; provide shade and cool tiles.",
    "rabbit_env_ventilation": "House in a dry, well-ventilated space out of drafts.",
    "rabbit_env_predators": "Keep hutches and runs secure from foxes, cats and birds of prey — even the sight of predators causes stress.",
    "rabbit_env_routine": "Rabbits are creatures of habit — keep feeding and cleaning routines consistent.",
    "rabbit_handling_hindquarters": "Always support the hindquarters when lifting — rabbits can injure their spine kicking.",
    "rabbit_handling_never_ears": "Never pick a rabbit up by the ears or scruff.",
    "rabbit_handling_ground": "Most rabbits prefer interaction at ground level over being carried.",
    "rabbit_handling_stress": "Learn stress signs — thumping, flattened ears, hiding — and give space when you see them.",
    "rabbit_hygiene_litter": "Clean the litter tray daily — rabbits can be litter trained like cats.",
    "rabbit_hygiene_flystrike": "Check the rear end daily in warm months — flystrike is a life-threatening emergency.",
    "rabbit_hygiene_nails": "Trim nails regularly or have a vet or groomer do it.",
    "rabbit_hygiene_brushing": "Brush during moulting seasons — swallowed fur can block the gut.",
    "rabbit_enrichment_tunnels": "Offer tunnels and cardboard boxes to run through and hide in.",
    "rabbit_enrichment_chew": "Provide untreated wood, willow balls and safe chew toys.",
    "rabbit_enrichment_companion": "Rabbits are social — a bonded, neutered companion is the best enrichment of all.",
    "rabbit_enrichment_forage": "Scatter-feed greens and hay to encourage natural foraging.",
    "rabbit_warning_stasis": "A rabbit that hasn't eaten or produced droppings for 12 hours is an emergency — call a vet immediately.",
    "rabbit_warning_dirty_rear": "A dirty rear end needs same-day attention, especially in summer.",
    "rabbit_warning_head_tilt": "A sudden head tilt or loss of balance means an urgent vet visit.",
    "rabbit_warning_teeth": "Drooling, dropping food or a wet chin can mean tooth problems — have a rabbit-savvy vet check.",
    # ── small_mammal ──
    "small_mammal_habitat_cage": "Choose a cage with the right size and bar spacing for your species, with a solid floor.",
    "small_mammal_habitat_bedding": "Use paper-based or aspen bedding — avoid cedar and pine shavings, which harm airways.",
    "small_mammal_habitat_hideouts": "Provide hideouts and nesting material for security and warmth.",
    "small_mammal_habitat_social": "Research whether your species lives alone or in groups — hamsters are solitary, guinea pigs need company.",
    "small_mammal_feeding_base_diet": "Feed a species-specific base diet — needs differ a lot between hamsters, guinea pigs, gerbils and rats.",
    "small_mammal_feeding_hay_vitc": "Guinea pigs need unlimited hay and daily vitamin C — they cannot make their own.",
    "small_mammal_feeding_water": "Check the water bottle works and refill it daily.",
    "small_mammal_feeding_treats": "Keep sugary fruits and shop treats occasional — obesity is common.",
    "small_mammal_env_sun_drafts": "Keep the cage out of direct sun and drafts.",
    "small_mammal_env_temperature": "Maintain a stable room temperature — sudden cold can trigger torpor in hamsters.",
    "small_mammal_env_quiet": "Give nocturnal species a quiet spot during the day to sleep.",
    "small_mammal_env_ventilation": "Ensure good ventilation — closed tanks trap ammonia from urine.",
    "small_mammal_handling_scoop": "Scoop up with both hands, low over a soft surface in case of jumps.",
    "small_mammal_handling_taming": "Tame gradually with treats and short sessions — let the animal come to you.",
    "small_mammal_handling_children": "Always supervise children handling small pets.",
    "small_mammal_handling_escapes": "Handle in a closed, escape-proofed room — small mammals are fast.",
    "small_mammal_hygiene_bedding": "Spot-clean soiled bedding often and do a full change weekly.",
    "small_mammal_hygiene_bottles": "Wash bottles and bowls regularly to stop bacteria building up.",
    "small_mammal_hygiene_teeth_nails": "Check teeth and nails — overgrowth is common and needs a vet.",
    "small_mammal_hygiene_hands": "Wash hands before and after cleaning or handling.",
    "small_mammal_enrichment_wheel": "Provide a solid-surface exercise wheel large enough that the back stays straight.",
    "small_mammal_enrichment_chew": "Offer safe chew items — rodent teeth grow continuously.",
    "small_mammal_enrichment_tunnels": "Add tunnels and multi-level areas for exploring.",
    "small_mammal_enrichment_scatter": "Scatter food in bedding to encourage natural foraging.",
    "small_mammal_warning_lethargy": "Lethargy or not eating in a small mammal always deserves a prompt vet call.",
    "small_mammal_warning_digestion": "Diarrhoea or a wet tail in hamsters is an emergency — see a vet the same day.",
    "small_mammal_warning_breathing": "Clicking or noisy breathing needs an exotics vet check.",
    "small_mammal_warning_fast_decline": "Small bodies decline fast — when in doubt, call an exotics vet early rather than waiting.",
    # ── fish ──
    "fish_habitat_tank_size": "Choose a tank sized for your fish's adult size and group needs — most 'starter' tanks are too small.",
    "fish_habitat_cycling": "Cycle the tank for several weeks before adding fish so beneficial bacteria can establish.",
    "fish_habitat_filtration": "Use a filter rated for your tank size with flow your species can handle.",
    "fish_habitat_tank_mates": "Research compatibility before mixing species — mismatches cause stress and injuries.",
    "fish_feeding_small_amounts": "Feed small amounts once or twice a day — only what is eaten in a couple of minutes.",
    "fish_feeding_remove_uneaten": "Remove uneaten food so it doesn't rot and pollute the water.",
    "fish_feeding_variety": "Vary the diet with foods suited to your species — flakes, pellets, frozen or live as appropriate.",
    "fish_feeding_no_overfeed": "Overfeeding is the most common cause of poor water quality — when in doubt, feed less.",
    "fish_env_water_testing": "Test water regularly for ammonia, nitrite, nitrate and pH — poor water quality is the top cause of illness.",
    "fish_env_water_changes": "Do partial water changes weekly rather than rare full changes.",
    "fish_env_dechlorinate": "Always treat tap water with a water conditioner before it touches the tank.",
    "fish_env_temperature": "Keep temperature stable with a heater and thermometer for tropical species.",
    "fish_handling_minimize": "Handle and net fish as little as possible — handling stress weakens their immune system.",
    "fish_handling_soft_net": "When netting is needed, use a soft, fine-mesh net and move slowly.",
    "fish_handling_acclimate": "Acclimate new fish slowly to the tank's water before releasing them.",
    "fish_handling_tap_water": "Never let untreated tap water touch your fish or filter media.",
    "fish_hygiene_filter_media": "Rinse filter media in removed tank water, never under the tap — it kills the good bacteria.",
    "fish_hygiene_algae": "Keep algae in check with regular maintenance rather than harsh chemicals.",
    "fish_hygiene_substrate": "Vacuum the substrate during water changes to remove waste.",
    "fish_hygiene_quarantine": "Quarantine new fish and plants before adding them to the main tank.",
    "fish_enrichment_plants": "Provide plants and hiding places — cover makes fish feel safe and show natural behaviour.",
    "fish_enrichment_mates": "Keep shoaling species in proper groups — a lone shoaling fish is a stressed fish.",
    "fish_enrichment_decor": "Vary the environment with decor suited to your species.",
    "fish_enrichment_current": "Match water flow to your species — some love current, others need calm water.",
    "fish_warning_gasping": "Fish gasping at the surface usually means a water problem — test the water immediately.",
    "fish_warning_fins_spots": "Clamped fins, white spots or fuzzy patches are signs to act on quickly.",
    "fish_warning_appetite": "A fish that stops eating or swims erratically needs attention.",
    "fish_warning_test_and_vet": "When something looks wrong: test the water first, then consult an aquatic or exotics vet.",
    # ── other (generico para exoticos) ──
    "other_habitat_research": "Research your species' natural habitat from reliable sources and replicate it as closely as you can.",
    "other_habitat_secure": "Use a secure, escape-proof enclosure — exotic pets are often skilled escapers.",
    "other_habitat_size": "Size the enclosure for the animal's adult size and activity level.",
    "other_habitat_substrate": "Choose bedding or substrate known to be safe for your species.",
    "other_feeding_research": "Learn your species' exact dietary needs from reliable, species-specific sources.",
    "other_feeding_water": "Provide fresh water at all times in a form your species can use.",
    "other_feeding_human_food": "Avoid human food unless it is confirmed safe for your species.",
    "other_feeding_schedule": "Keep a consistent feeding schedule and watch that food is actually being eaten.",
    "other_env_research": "Find out your species' ideal temperature, humidity and light cycle.",
    "other_env_measure": "Measure conditions with a thermometer and hygrometer instead of guessing.",
    "other_env_sun_drafts": "Keep the enclosure out of direct sun and cold drafts.",
    "other_env_stability": "Stable conditions matter more than perfect ones — avoid sudden changes.",
    "other_handling_research": "Learn the safe handling technique for your specific species before picking it up.",
    "other_handling_hands": "Wash your hands before and after handling.",
    "other_handling_short": "Keep handling sessions short and calm until trust is built.",
    "other_handling_stress": "Learn your species' stress signals and stop when you see them.",
    "other_hygiene_routine": "Set a regular cleaning routine: spot-clean often, deep-clean on schedule.",
    "other_hygiene_safe_products": "Use only cleaning products confirmed safe for your species.",
    "other_hygiene_quarantine": "Quarantine new animals before introducing them to existing pets.",
    "other_hygiene_hands": "Good hand hygiene protects you and your pet from shared infections.",
    "other_enrichment_research": "Research what enrichment suits your species — climbing, digging, foraging or hiding.",
    "other_enrichment_rotate": "Rotate enrichment items to keep the environment interesting.",
    "other_enrichment_natural_behaviour": "Respect natural rhythms — don't wake nocturnal species for daytime play.",
    "other_enrichment_food": "Use food-based enrichment to encourage natural foraging behaviour.",
    "other_warning_changes": "Watch for changes in appetite, droppings, energy or appearance — with exotics, subtle changes matter.",
    "other_warning_find_vet": "Find an exotics vet BEFORE you need one — not every clinic treats exotic species.",
    "other_warning_when_unsure": "When unsure, call an exotics vet — early advice is cheaper and safer than waiting.",
    "other_warning_no_self_treatment": "Never medicate an exotic pet yourself — treatments safe for dogs or cats can be fatal to other species.",
}


# ── Ownership helper (padrao travel_service) ─────────────────
def _own_pet_or_403(sb, user: CurrentUser, pet_id: str) -> dict:
    res = (
        sb.table("pets")
        .select("owner_id, species, name")
        .eq("id", pet_id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found")
    if res.data[0]["owner_id"] != user.id and user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return res.data[0]


def _guide_for_pet_or_404(sb, user: CurrentUser, pet_id: str) -> tuple[dict, str]:
    """Retorna (pet, species) ou 404 se a especie nao for exotica."""
    pet = _own_pet_or_403(sb, user, pet_id)
    species = pet.get("species") or ""
    if species not in EXOTIC_SPECIES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Care guide not available for this species",
        )
    return pet, species


# ── API ──────────────────────────────────────────────────────
def get_care_guide(user: CurrentUser, pet_id: str) -> CareGuideResponse:
    sb = get_service_client()
    _, species = _guide_for_pet_or_404(sb, user, pet_id)
    guide = CARE_GUIDES[species]
    return CareGuideResponse(
        species=species,
        sections=[CareGuideSection(key=s, tips=guide[s]) for s in SECTIONS],
    )


# ── PDF (A4, ingles na v1 — padrao visual do travel_service) ─
def _pdf_safe(text: str) -> str:
    """Helvetica so cobre cp1252; substitui o resto para nao dar 500."""
    return text.encode("cp1252", "replace").decode("cp1252")


def care_guide_pdf(user: CurrentUser, pet_id: str) -> bytes:
    sb = get_service_client()
    pet, species = _guide_for_pet_or_404(sb, user, pet_id)
    guide = CARE_GUIDES[species]

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4
    text_width = w - 45 * mm  # margem esquerda 20mm + bullet + margem direita
    y = h - 20 * mm

    c.setFillColor(BRAND)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(20 * mm, y, "TALOA Care Guide")
    y -= 9 * mm
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(20 * mm, y, _pdf_safe(pet.get("name") or "Pet"))
    y -= 6 * mm
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, y, _pdf_safe(species.replace("_", " ").title()))
    y -= 10 * mm

    for section in SECTIONS:
        if y < 40 * mm:  # header nunca fica orfao no fim da pagina
            c.showPage()
            y = h - 20 * mm
        y -= 3 * mm
        c.setFillColor(BRAND)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(20 * mm, y, SECTION_TITLES_EN[section])
        y -= 7 * mm
        for key in guide[section]:
            text = _pdf_safe(TIP_TEXTS_EN.get(key, key))
            lines = simpleSplit(text, "Helvetica", 10, text_width)
            if y - len(lines) * 5 * mm < 20 * mm:  # dica inteira na mesma pagina
                c.showPage()
                y = h - 20 * mm
            c.setFillColor(INK)
            c.setFont("Helvetica", 10)
            c.drawString(20 * mm, y, "•")
            for line in lines:
                c.drawString(25 * mm, y, line)
                y -= 5 * mm
            y -= 1.5 * mm

    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8)
    c.drawString(
        20 * mm, 12 * mm,
        "Generated by TALOA · taloa.ie · General care guidance, not veterinary advice. Always consult an exotics vet.",
    )
    c.save()
    return buf.getvalue()
