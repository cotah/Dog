"""Constantes do dominio TALOA. REGRA: nunca usar 'dog' como nome — so como valor."""

TAG_PREFIX = "TAL"

# Especies aceitas (o sistema suporta qualquer especie desde o inicio)
SPECIES_LIST = [
    "dog",
    "cat",
    "bird",
    "reptile",
    "rabbit",
    "small_mammal",
    "fish",
    "other",
]

TAG_STATUSES = ["inactive", "active", "lost", "disabled"]

SERVICE_TYPES = [
    "dog_walking",
    "grooming",
    "training",
    "daycare",
    "pet_sitting",
    "emergency_support",
    "premium_tag",
    "other",
]
