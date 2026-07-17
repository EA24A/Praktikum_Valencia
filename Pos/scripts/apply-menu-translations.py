#!/usr/bin/env python3
"""One-off: fill EN/DE product and category names in the live database."""

from __future__ import annotations

from pathlib import Path
from urllib.parse import urlparse

import pg8000.native

CATEGORY_UPDATES: dict[str, tuple[str, str]] = {
    "cmqwckyaj000mygubsdysowpi": ("Coffee & Tea", "Kaffee & Tee"),
    "cmqwckyn8000tygub5loimsng": ("Iced Coffee Collection", "Eiskaffee-Spezialitäten"),
    "cmqwckyhu000qygub012ubwst": ("Desserts", "Nachspeisen"),
    "cmqw2jurz00098oubp27jmwdo": ("Desserts", "Nachspeisen"),
    "cmqw2jukc00068ouboog9g7nf": ("Food", "Speisen"),
    "cmqwckyg1000pygubzzixgo47": ("Lebanese Bites", "Libanesische Häppchen"),
}

PRODUCT_UPDATES: dict[str, tuple[str, str]] = {
    # Main courses
    "cmqwckzgb0018ygubt2kp0fgy": ("Lebanese Beef Shawarma", "Libanesisches Rinderschawarma"),
    "cmqwckzi40019ygubuxdw9hn6": ("Lebanese Chicken Shawarma", "Libanesisches Hähnchenschawarma"),
    "cmqwckzjw001aygub4mlrhomb": (
        "Arayes Kafta (Grilled Lebanese Meat Pita)",
        "Arayes Kafta (Gefülltes libanesisches Fleisch-Pita)",
    ),
    "cmqwckzcm0016ygubior0yga6": ("Hummus with Chicken", "Hummus mit Hähnchen"),
    "cmqwckzef0017ygubnhrhdwso": ("Hummus with Beef", "Hummus mit Rindfleisch"),
    "cmqz7161r000004l5dnmumu4w": ("Falafel Wrap", "Falafel-Wrap"),
    "cmr0al52b000104jsyfeh61dp": ("Tawook Wrap", "Tawook-Wrap"),
    "cmqwckzwg001hygubs7yubwys": ("Chicken Shawarma", "Hähnchenschawarma"),
    "cmqwckzya001iygub008gpv1y": ("Beef Shawarma", "Rinderschawarma"),
    # Starters
    "cmqwckyzx000zygubgmrubxb3": ("Sfiha", "Sfiha"),
    "cmqwckz1o0010ygubh700f1j9": ("Spinach Fatayer", "Spinat-Fatayer"),
    "cmqwckz3h0011ygubxbi67qil": ("Falafel", "Falafel"),
    "cmqwckz5d0012ygubchyz9h1v": ("Kibbeh", "Kibbeh"),
    "cmqwckz760013ygub3fvk4jz8": ("Tabbouleh", "Taboulé"),
    "cmqwckz8y0014ygubcesiuphk": ("Hummus", "Hummus"),
    "cmqwckzas0015ygubvnxof3ud": ("Stuffed Grape Leaves", "Gefüllte Weinblätter"),
    "cmr0anzsj00000al3k8je803l": ("Stuffed Grape Leaves", "Gefüllte Weinblätter"),
    # Desserts
    "cmqwcl03s001jygubfblo8sig": ("Classic Baklava", "Baklava klassisch"),
    "cmqwcl05o001kygub00vrj08v": ("Pistachio Baklava", "Pistazien-Baklava"),
    "cmqwcl07g001lygub3ayoed5g": ("Knafeh", "Knafeh"),
    "cmqwcl099001mygubb3jqmjc7": ("Kashta Ice Cream", "Kashta-Eis"),
    "cmqwcl0b1001nygubz6xc79ch": (
        "Baklava with Kashta Ice Cream",
        "Baklava mit Kashta-Eis",
    ),
    # Coffee & tea
    "cmqwckyqu000uygub1qrdv5q5": ("Espresso", "Espresso"),
    "cmqwckysp000vygub5xqtjbb5": ("Cortado", "Cortado"),
    "cmqwckyuj000wygub2ejmh96t": ("Café Cremaet", "Café Cremaet"),
    "cmqwckywb000xygub36lpp0c0": ("Coffee with Milk", "Kaffee mit Milch"),
    "cmqwckyy5000yygubb8gsu5fg": ("Lebanese Coffee", "Libanesischer Kaffee"),
    "cmr0aw7rb000009j7s1vsslc3": ("Lebanese Tea", "Libanesischer Tee"),
    # Iced coffee collection
    "cmqwcl17o0024ygublvw4byf6": ("Iced Latte", "Eis-Latte"),
    "cmqwcl19f0025ygubpt65f7zr": ("Biscoff Iced Latte", "Biscoff Eis-Latte"),
    "cmqwcl1b70026ygubku5ahvet": ("Oreo Iced Latte", "Oreo Eis-Latte"),
    "cmqwcl1cz0027ygubeonxgirt": ("Pistachio Iced Latte", "Pistazien Eis-Latte"),
    "cmqwcl1er0028ygub1kj1b67z": ("Salted Caramel Iced Latte", "Salzkaramell Eis-Latte"),
    "cmqwcl1gl0029ygub3ew72ufx": ("Vanilla Iced Latte", "Vanille Eis-Latte"),
    "cmqwcl1ie002aygubez3udpgi": ("Mocha Iced Latte", "Mocha Eis-Latte"),
    "cmqwcl1k6002bygubkabj38az": ("Spanish Latte", "Spanish Latte"),
    "cmqwcl1m1002cygubta5msflq": ("Affogato Freddo", "Affogato Freddo"),
    "cmqwcl1o1002dygubu4khgc19": ("Iced Americano", "Eis-Americano"),
    "cmqwcl1pu002eygub0beuwv32": ("Freddo Cappuccino", "Freddo Cappuccino"),
    "cmqwcl1rn002fygubvchinitz": ("Freddo Espresso", "Freddo Espresso"),
    "cmqwcl1tm002gygub6mvl1ok3": ("Matcha Latte", "Matcha Latte"),
    "cmqwcl1vf002hygub9re3vv2c": ("Iced Strawberry Matcha", "Erdbeer-Matcha Eisgetränk"),
    "cmqwcl1x7002iygubq4ux5epz": ("Mango Matcha", "Mango-Matcha"),
    "cmqwcl1yy002jygubnuz8oy4l": ("Fenicia Lemonade", "Fenicia-Limonade"),
    "cmqwnmjid0002kcub32x389bu": ("Vanilla Iced Coffee", "Vanille-Eiskaffee"),
    # Drinks
    "cmqw2jugk00058oubzg3hadj5": ("Water", "Wasser"),
    "cmqwcl0en001oygubyypebqsi": ("Soft Drinks", "Erfrischungsgetränke"),
    "cmr0b0q4u000109j7tufk70rs": ("Beer", "Bier"),
    "cmr0b2dbs000209j7zblee9pu": ("Non-alcoholic Beer", "Alkoholfreies Bier"),
    "cmr0b3jnc000004l5yc0svfsq": ("Tyris Craft Beer Valencia", "Tyris Craft-Bier Valencia"),
    "cmr0b52x7000004jsyt286y0o": ("Fenicia Lemonade", "Fenicia-Limonade"),
    "cmr0b6sh0000004jsz9op9vtr": ("Fresh Orange Juice", "Frisch gepresster Orangensaft"),
    "cmr0cy2cu000004l4cutgcfu6": ("Ayran", "Ayran"),
    "cmqwcl0gh001pygub0sk505by": ("Estrella Galicia Beer", "Estrella Galicia Bier"),
    "cmqwcl0i9001qygub1mne40bw": ("Fenicia Lemonade", "Fenicia-Limonade"),
    "cmqwcl0k1001rygubrl2w859j": ("Tyris Beer", "Tyris Bier"),
    "cmqwnjxec0000kcubqzpv49r7": ("Amstel Beer", "Amstel Bier"),
    "cmqwnkegg0001kcube93hrf87": ("Heineken Beer", "Heineken Bier"),
    # Cocktails
    "cmqwcl0m4001sygubyhkcv393": ("Vermouth", "Wermut"),
    "cmqwcl0rk001vygubu03ow2mo": ("Agua de Valencia", "Agua de Valencia"),
    "cmqwcl0tc001wygub92lkavas": ("Gin & Tonic", "Gin Tonic"),
    "cmqwcl0v5001xygubfmo8erm4": ("Rum & Cola", "Rum-Cola"),
    "cmqwcl0wy001yygub0lir02en": ("Aperol Spritz", "Aperol Spritz"),
    "cmqwcl0ys001zygubpznpdu41": ("Caipiroska", "Caipiroska"),
    "cmqwcl0nz001tygubx27i8umq": ("Avocado Cocktail", "Avocado-Cocktail"),
    "cmqwcl0pq001uygub0axzaofr": ("Nashi Cocktail", "Nashi-Cocktail"),
    # Combos
    "cmqwcl10k0020ygub44nnznpj": ("Coffee + Baklava", "Kaffee + Baklava"),
    "cmqwcl12c0021ygub50mi5ij3": ("2 Sfiha + Ayran", "2 Sfiha + Ayran"),
    "cmqwcl1440022ygubtbqjd3ma": (
        "Beef Shawarma + Soft Drink",
        "Rinderschawarma + Erfrischungsgetränk",
    ),
    "cmqwcl15w0023ygubv7c5q4b5": (
        "Chicken Shawarma + Soft Drink",
        "Hähnchenschawarma + Erfrischungsgetränk",
    ),
    # Inactive / legacy seed items
    "cmqw2jum800078oub5wydf0s0": ("Toast", "Toast"),
    "cmqw2juo400088oubtl56wryq": ("Sandwich", "Sandwich"),
    "cmqw2jutu000a8oubre9flypf": ("Cheesecake", "Käsekuchen"),
    "cmqw2juvr000b8oub29vu4wih": ("Brownie", "Brownie"),
    "cmqw2jucr00038oube8xutaeh": ("Espresso", "Espresso"),
    "cmqw2juen00048oubkyjsal1c": ("Cortado", "Cortado"),
    "cmqwdeimg002kygubwg6mya1k": ("Affogato", "Affogato"),
    # Inactive Lebanese bites duplicates
    "cmqwckzln001bygub3o5c8u7s": ("Sfiha", "Sfiha"),
    "cmqwckznf001cygubbrt83hyk": ("Spinach Fatayer", "Spinat-Fatayer"),
    "cmqwckzpb001dygub75737qye": ("Kibbeh", "Kibbeh"),
    "cmqwckzr3001eygubxjlh3kr8": ("Mini Manakish", "Mini-Manakish"),
    "cmqwckzsw001fygubzvwplw0z": ("Falafel", "Falafel"),
    "cmqwckzuo001gygubnfw886sb": ("Hummus", "Hummus"),
}

# Duplicate active grape leaves — keep the newer row, deactivate the older one.
DEACTIVATE_PRODUCT_IDS = {"cmqwckzas0015ygubvnxof3ud"}


def load_db_url() -> str:
    env_path = Path(__file__).resolve().parents[1] / ".env"
    for line in env_path.read_text().splitlines():
        if line.startswith("DATABASE_URL="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("DATABASE_URL not found")


def main() -> None:
    db_url = load_db_url()
    parsed = urlparse(db_url.replace("postgres://", "postgresql://", 1))
    conn = pg8000.native.Connection(
        user=parsed.username,
        password=parsed.password,
        host=parsed.hostname,
        port=parsed.port or 5432,
        database=parsed.path.lstrip("/"),
    )

    for category_id, (name_en, name_de) in CATEGORY_UPDATES.items():
        conn.run(
            'UPDATE "Category" SET "nameEn" = :name_en, "nameDe" = :name_de WHERE "id" = :id',
            name_en=name_en,
            name_de=name_de,
            id=category_id,
        )

    for product_id, (name_en, name_de) in PRODUCT_UPDATES.items():
        conn.run(
            'UPDATE "Product" SET "nameEn" = :name_en, "nameDe" = :name_de WHERE "id" = :id',
            name_en=name_en,
            name_de=name_de,
            id=product_id,
        )

    for product_id in DEACTIVATE_PRODUCT_IDS:
        conn.run(
            'UPDATE "Product" SET "isActive" = false WHERE "id" = :id',
            id=product_id,
        )

    conn.close()
    print(f"Updated {len(CATEGORY_UPDATES)} categories")
    print(f"Updated {len(PRODUCT_UPDATES)} products")
    print(f"Deactivated {len(DEACTIVATE_PRODUCT_IDS)} duplicate products")


if __name__ == "__main__":
    main()
