"""Cria os produtos/precos da TALOA no Stripe (test mode) e popula a tabela `plans`.

Idempotente: pula planos que ja tem `stripe_price_id` no banco, entao pode rodar
de novo sem duplicar nada no Stripe.

Rodar a partir de taloa-api/:
    python -m scripts.seed_stripe_plans
"""
import stripe

from app.config import settings
from app.core.supabase import get_service_client

stripe.api_key = settings.STRIPE_SECRET_KEY

# Catalogo TALOA (brief v2.0, secao 1). amount em centavos de EUR.
PLANS = [
    {
        "name": "free",
        "display_name": "TALOA Free",
        "description": "Perfil basico, Lost Mode, QR/NFC e contato seguro.",
        "amount": 0,
        "interval": "month",
        "max_pets": 1,
        "sort": 1,
        "features": ["basic_profile", "lost_mode", "secure_contact", "qr_nfc"],
    },
    {
        "name": "plus",
        "display_name": "TALOA Plus",
        "description": "Free + alertas de scan, historico, Vet Directory, IA basica e descontos.",
        "amount": 699,
        "interval": "month",
        "max_pets": 2,
        "sort": 2,
        "features": [
            "everything_free",
            "scan_alerts",
            "scan_history",
            "vet_directory",
            "ai_basic",
            "partner_discounts",
        ],
    },
    {
        "name": "club",
        "display_name": "TALOA Club",
        "description": "Plus + Tag Premium, Welcome Kit, Emergency Card, Travel ID, Paw Points e Care Drop.",
        "amount": 1199,
        "interval": "month",
        "max_pets": 3,
        "sort": 3,
        "features": [
            "everything_plus",
            "premium_tag",
            "welcome_kit",
            "emergency_card",
            "travel_id",
            "ai_full",
            "paw_points",
            "care_drop",
        ],
    },
    {
        "name": "exotic_club",
        "display_name": "TALOA Exotic Club",
        "description": "Club + Habitat ID, Vet Directory especializado e conteudo por especie.",
        "amount": 1499,
        "interval": "month",
        "max_pets": 3,
        "sort": 4,
        "features": ["everything_club", "habitat_id", "specialist_vets", "species_content"],
    },
    {
        "name": "family",
        "display_name": "TALOA Family",
        "description": "Club + ate 5 pets e multiplas tags premium.",
        "amount": 1499,
        "interval": "month",
        "max_pets": 5,
        "sort": 5,
        "features": ["everything_club", "up_to_5_pets", "multiple_premium_tags"],
    },
    {
        "name": "premium_tag",
        "display_name": "TALOA Premium Tag",
        "description": "Tag premium avulsa (pagamento unico) para quem nao quer assinar.",
        "amount": 2299,
        "interval": "one_time",
        "max_pets": 1,
        "sort": 6,
        "features": ["premium_tag", "qr_nfc"],
    },
]


def main() -> None:
    if not stripe.api_key:
        raise SystemExit("STRIPE_SECRET_KEY ausente no .env")
    sb = get_service_client()

    for p in PLANS:
        existing = (
            sb.table("plans").select("id, stripe_price_id").eq("name", p["name"]).limit(1).execute()
        )
        if existing.data and existing.data[0].get("stripe_price_id"):
            print(f"  skip  {p['name']:<12} (ja tem price {existing.data[0]['stripe_price_id']})")
            continue

        product = stripe.Product.create(
            name=p["display_name"],
            description=p["description"],
            metadata={"taloa_plan": p["name"]},
        )

        price_args = {
            "product": product.id,
            "unit_amount": p["amount"],
            "currency": "eur",
            "metadata": {"taloa_plan": p["name"]},
        }
        if p["interval"] != "one_time":
            price_args["recurring"] = {"interval": p["interval"]}
        price = stripe.Price.create(**price_args)

        sb.table("plans").upsert(
            {
                "name": p["name"],
                "display_name": p["display_name"],
                "description": p["description"],
                "price_eur": p["amount"] / 100,
                "billing_interval": p["interval"],
                "max_pets": p["max_pets"],
                "features": p["features"],
                "stripe_product_id": product.id,
                "stripe_price_id": price.id,
                "sort_order": p["sort"],
                "is_active": True,
            },
            on_conflict="name",
        ).execute()
        print(f"  create {p['name']:<12} -> {price.id}")

    print("\nDone. Planos no Stripe + tabela plans populada.")


if __name__ == "__main__":
    main()
