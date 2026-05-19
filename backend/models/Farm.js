/**
 * Farm — MongoDB / Mongoose schema.
 *
 * Stores one document per saved farm boundary.
 * polygonCoordinates holds the full lat/lng array inline so a single document
 * fetch returns everything needed to render the farm on a map.
 *
 * Indexes:
 *   { userId, farmStatus, createdAt }  — primary list query
 *   { farmId }                         — single-farm lookup
 */
const mongoose = require('mongoose');

// ── Sub-schema: one lat/lng vertex ───────────────────────────────────────────
const CoordinateSchema = new mongoose.Schema(
  {
    latitude:  { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false },
);

// ── Main schema ───────────────────────────────────────────────────────────────
const FarmSchema = new mongoose.Schema(
  {
    // ── Identity ────────────────────────────────────────────────────────────
    farmId:   { type: String, required: true, unique: true },   // client-generated
    userId:   { type: String, required: true },                 // FK → users.id

    // ── Farm details ─────────────────────────────────────────────────────────
    farmName:    { type: String, required: true, trim: true, maxlength: 150 },
    village:     { type: String, default: '',   trim: true },
    primaryCrop: { type: String, default: '',   trim: true },

    // ── Polygon ──────────────────────────────────────────────────────────────
    polygonCoordinates: {
      type:     [CoordinateSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 3,
        message:   'A farm polygon requires at least 3 coordinate points.',
      },
    },
    centerLat: { type: Number },
    centerLng: { type: Number },

    // ── Area & perimeter ─────────────────────────────────────────────────────
    areaSqm:      { type: Number, min: 0 },
    areaAcres:    { type: Number, min: 0 },
    areaBigha:    { type: Number, min: 0 },
    areaHectares: { type: Number, min: 0 },
    areaVigha:    { type: Number, min: 0 },
    areaSqFt:     { type: Number, min: 0 },
    perimeterM:   { type: Number, min: 0 },

    // ── Metadata ─────────────────────────────────────────────────────────────
    method: {
      type:    String,
      enum:    ['manual', 'gps-walk', 'walk'],
      default: 'manual',
    },

    // ── Validation flags (set by OSM / building detection) ───────────────────
    warningDetected: { type: Boolean, default: false },
    warningTypes:    [{ type: String }],   // e.g. ['residential','commercial']

    // ── Optional map snapshot ─────────────────────────────────────────────────
    mapSnapshot: { type: String, default: null },   // S3 / CDN URL

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    farmStatus: {
      type:    String,
      enum:    ['active', 'deleted', 'archived'],
      default: 'active',
    },
    deletedAt:  { type: Date,   default: null },
    createdAt:  { type: Date,   default: Date.now },
    updatedAt:  { type: Date,   default: Date.now },
  },
  {
    collection: 'farms',
    timestamps: false,   // timestamps managed manually
  },
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Fast: "give me all active farms for this user, newest first"
// Note: farmId unique index is already created by the field-level `unique: true`.
FarmSchema.index({ userId: 1, farmStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Farm', FarmSchema);
