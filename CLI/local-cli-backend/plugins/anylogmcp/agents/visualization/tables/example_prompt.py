_EX_PROMPT = """
1. The Pro Photography Titan (iPhone 17 Pro Max)

Designed for mobile cinematographers, this flagship features a massive 6.9-inch Super Retina display and is powered by a new internal architecture with 12 GB of RAM. To handle high-resolution 4K ProRes video files, it starts with 256 GB of base storage and utilizes a 4,823 mAh battery to sustain long shooting sessions.
2. The Open-Source Powerhouse (OnePlus 15)

Marketed as the ultimate "everything" Android phone, this device boasts a vibrant 6.78-inch AMOLED panel and an industry-leading 16 GB of RAM for extreme multitasking. It offers a generous 512 GB of base storage as its entry-level standard and is equipped with a high-density 5,400 mAh battery that supports ultra-fast 100W charging.
3. The Compact Productivity Tool (Samsung Galaxy S25)

Catering to users who prefer one-handed use without sacrificing speed, this model utilizes a crisp 6.2-inch Dynamic LTPO display paired with 8 GB of RAM. It provides a reliable 128 GB of base storage for apps and photos, while its energy-efficient processor helps maximize the life of its 4,000 mAh battery.
4. The AI-Integrated Flagship (Google Pixel 10 Pro)

Focusing heavily on machine learning and image processing, this phone centers around a 6.3-inch Actua display and a boosted 12 GB of RAM to run on-device AI models. It comes standard with 128 GB of base storage and relies on a 4,700 mAh battery designed to prioritize longevity through adaptive power software.
5. The Luxury Foldable (Samsung Galaxy Z Fold 7)

Redefining the tablet-phone hybrid, this device unfolds to reveal a sprawling 7.6-inch primary screen supported by 12 GB of RAM for multi-window productivity. To account for its complex design, it starts with 256 GB of base storage and manages its dual-display power draw with a specialized 4,400 mAh dual-cell battery system.
"""

_EX_PROMPT = """
1. The German Engineering Icon (Porsche 911 Carrera)

This legendary rear-engine sports car is meticulously balanced for the track, utilizing a twin-turbocharged flat-six engine that produces 388 hp and 331 lb-ft of torque. Its compact, aerodynamic silhouette measures exactly 178.8 inches in length, and it maintains its classic silhouette with a sleek 2-door configuration.
2. The Electric Performance Leader (Tesla Model S Plaid)

Defining the modern era of silent speed, this tri-motor electric sedan delivers a staggering 1,020 hp and 714 lb-ft of instant torque. Despite its supercar-rivaling acceleration, it remains a practical family vehicle with a total length of 197.7 inches and a traditional 4-door layout.
3. The Reimagined American Muscle (Dodge Charger Daytona Scat Pack)

Transitioning into the world of high-output electrification, this heavy-hitting muscle car commands the road with 670 hp and 627 lb-ft of torque. It features a commanding presence at 206.6 inches long, and while it stays true to its heritage, it is now widely available in a versatile 4-door body style.
4. The Electrified Workhorse (Ford F-150 Lightning)

Combining utility with advanced propulsion, this all-electric pickup truck offers a robust 580 hp and a massive 775 lb-ft of torque for hauling and towing. To accommodate its expansive cargo bed and spacious "SuperCrew" cabin, it stretches to a length of 232.7 inches and features a standard 4-door setup.
5. The Efficient Hybrid Standard (Toyota Camry XSE)

Focused on blending everyday reliability with a touch of sportiness, this hybrid sedan utilizes a dual-motor system to generate a combined 232 hp and 163 lb-ft of torque. It serves as a benchmark for the midsize segment with an overall length of 193.5 inches and the convenience of a 4-door entry.
"""

EX_PROMPT = """
- Porsche 911 Carrera: Horsepower=388, Torque=331 lb-ft, Length=178.8 inches, Doors=2, Body Type=2-door, Engine Type=Internal Combustion\n- Tesla Model S Plaid: Horsepower=1020, Torque=714 lb-ft, Length=197.7 inches, Doors=4, Body Type=4-door, Engine Type=Electric\n- Dodge Charger Daytona Scat Pack: Horsepower=670, Torque=627 lb-ft, Length=206.6 inches, Doors=4, Body Type=4-door, Engine Type=Internal Combustion\n- Ford F-150 Lightning: Horsepower=580, Torque=775 lb-ft, Length=232.7 inches, Doors=4, Body Type=4-door, Engine Type=Electric\n- Toyota Camry XSE: Horsepower=232, Torque=163 lb-ft, Length=193.5 inches, Doors=4, Body Type=4-door, Engine Type=Hybrid\nThis data represents a comparative overview of five high-performance vehicles across different powertrain types, highlighting their performance metrics, physical dimensions, and body configurations
"""
#     @field_validator('rows')
#     @classmethod
#     def validate_rows(cls, rows, info):
#         if not rows:
#             raise ValueError(
#                 "rows array is empty. Each entity in data_description must be a row. "
#                 "Do not return an empty rows array."
#             )

#         if 'column_info' in info.data:
#             column_info = info.data['column_info']

#             if not column_info:
#                 raise ValueError(
#                     "column_info array is empty. Each attribute in data_description must be a column. "
#                     "Do not return an empty column_info array."
#                 )

#             column_labels = {col.label for col in column_info}
            
#             for i, row in enumerate(rows):
#                 if not row.entries:
#                     raise ValueError(
#                         f"Row {i} has no entries. Every row must have exactly "
#                         f"{len(column_info)} entries matching column_info."
#                     )

#                 entry_keys = {entry.row_key for entry in row.entries}
                
#                 if entry_keys != column_labels:
#                     missing = column_labels - entry_keys
#                     extra = entry_keys - column_labels
#                     error_msg = f"Row {i} column mismatch."
#                     if missing:
#                         error_msg += f" Missing: {missing}."
#                     if extra:
#                         error_msg += f" Extra: {extra}."
#                     raise ValueError(error_msg)
                
#                 label_to_numeric = {col.label: col.is_numeric for col in column_info}
#                 for entry in row.entries:
#                     if label_to_numeric[entry.row_key] and entry.value is not None:
#                         if not isinstance(entry.value, (int, float)):
#                             raise ValueError(
#                                 f"Row {i}, column '{entry.row_key}': "
#                                 f"is_numeric=True but value is {type(entry.value).__name__}: {entry.value}"
#                             )
        
#         return rows