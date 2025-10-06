async function metadataFromSequelizeModel(sequelizeModel, overrides = {}, models = {}) {
    const attributes = sequelizeModel.rawAttributes;
    const meta = [];

    for (const fieldName in attributes) {
        if (["createdAt", "updatedAt", "deleted_at", 'id', 'user_id'].includes(fieldName)) continue;

        const attr = attributes[fieldName];
        

        let field = {
            name: fieldName,
            type: mapType(attr.type.key),
            required: attr.allowNull === false,
            default: attr.defaultValue ?? null,
            enum: attr.values || null,
            ref: attr.references ? attr.references.model : null,
            label: humanize(fieldName),
            placeholder: "",
        };

        // Foreign key handling
        const refName = overrides[fieldName]?.ref || (attr.references ? attr.references.model : null);

        if (refName && models[refName]) {
            const refModel = models[refName];
            const possibleLabels = ["name", "title", "label"];
            const labelField = possibleLabels.find(f => f in refModel.rawAttributes) || "id";

            const records = await refModel.findAll({ attributes: ["id", labelField] });
            field.type = "dropdown";
            field.ref = refName;
            field.options = records.map(r => ({ label: r[labelField], value: r.id }));
        }

        // Apply overrides
        if (overrides[fieldName]) {
            field = { ...field, ...overrides[fieldName] };
        }

        meta.push(field);
    }

    return meta;
}



// Map Sequelize DataTypes → form field types
function mapType(typeKey) {
    switch (typeKey) {
        case "STRING":
        case "UUID":
            return "string";
        case "INTEGER":
        case "BIGINT":
        case "FLOAT":
        case "DOUBLE":
        case "DECIMAL":
            return "number";
        case "DATE":
        case "DATEONLY":
            return "date";
        case "BOOLEAN":
            return "boolean";
        case "JSON":
        case "JSONB":
            return "object";
        default:
            return "string";
    }
}

// Convert fieldName → human-friendly label
function humanize(s) {
    return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

module.exports = metadataFromSequelizeModel;
