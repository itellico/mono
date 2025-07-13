import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

/**
 * Comprehensive Model Schemas Seeder
 * 
 * Creates dynamic profile templates for all creative industry roles using the option sets.
 * Each schema defines the structure, fields, and UI organization for different profile types.
 */

// Helper to get option set ID by slug (assumes option sets are already seeded)
async function getOptionSetId(slug: string): Promise<number> {
  const optionSet = await prisma.optionSet.findFirst({
    where: { slug },
    select: { id: true }
  });
  
  if (!optionSet) {
    throw new Error(`Option set with slug "${slug}" not found. Please run option sets seeder first.`);
  }
  
  return optionSet.id;
}

// Create field definition helper
const createField = (
  name: string,
  type: string,
  config: {
    label?: Record<string, string>;
    required?: boolean;
    optionSetSlug?: string;
    allowMultiple?: boolean;
    tab?: string;
    group?: string;
    order?: number;
    unit?: string;
    placeholder?: Record<string, string>;
    helpText?: Record<string, string>;
    visibleToRoles?: string[];
    editableByRoles?: string[];
    validation?: Record<string, any>;
  } = {}
) => ({
  name,
  type,
  label: config.label || { 'en-US': name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) },
  required: config.required || false,
  optionSetSlug: config.optionSetSlug,
  allowMultiple: config.allowMultiple || false,
  tab: config.tab || 'Basic Info',
  group: config.group,
  order: config.order || 0,
  unit: config.unit,
  placeholder: config.placeholder,
  helpText: config.helpText,
  visibleToRoles: config.visibleToRoles,
  editableByRoles: config.editableByRoles,
  validation: config.validation
});

export const COMPREHENSIVE_MODEL_SCHEMAS = {

  // ===========================================
  // HUMAN MODEL SCHEMAS
  // ===========================================

  // Baby Models (0-2 years)
  baby_model: {
    type: 'profile',
    subType: 'baby_model',
    displayName: {
      'en-US': 'Baby Model',
      'es-ES': 'Modelo Bebé',
      'fr-FR': 'Modèle Bébé',
      'de-DE': 'Baby-Model'
    },
    description: {
      'en-US': 'Profile for baby models aged 0-2 years with guardian management',
      'es-ES': 'Perfil para modelos bebé de 0-2 años con gestión de tutores',
      'fr-FR': 'Profil pour les modèles bébés âgés de 0-2 ans avec gestion des tuteurs',
      'de-DE': 'Profil für Baby-Models im Alter von 0-2 Jahren mit Vormundschaftsverwaltung'
    },
    isActive: true,
    schema: {
      fields: [
        // Basic Information
        createField('first_name', 'string', { 
          label: { 'en-US': 'First Name', 'es-ES': 'Nombre', 'fr-FR': 'Prénom', 'de-DE': 'Vorname' },
          required: true, tab: 'Basic Info', order: 1 
        }),
        createField('last_name', 'string', { 
          label: { 'en-US': 'Last Name', 'es-ES': 'Apellido', 'fr-FR': 'Nom de famille', 'de-DE': 'Nachname' },
          required: true, tab: 'Basic Info', order: 2 
        }),
        createField('date_of_birth', 'date', { 
          label: { 'en-US': 'Date of Birth', 'es-ES': 'Fecha de Nacimiento', 'fr-FR': 'Date de naissance', 'de-DE': 'Geburtsdatum' },
          required: true, tab: 'Basic Info', order: 3 
        }),
        createField('gender', 'option_set', { 
          label: { 'en-US': 'Gender', 'es-ES': 'Género', 'fr-FR': 'Genre', 'de-DE': 'Geschlecht' },
          optionSetSlug: 'genders', required: true, tab: 'Basic Info', order: 4 
        }),

        // Physical Characteristics
        createField('height', 'option_set', { 
          label: { 'en-US': 'Height', 'es-ES': 'Altura', 'fr-FR': 'Taille', 'de-DE': 'Größe' },
          optionSetSlug: 'height_baby', required: true, tab: 'Physical', order: 1, unit: 'cm' 
        }),
        createField('weight', 'option_set', { 
          label: { 'en-US': 'Weight', 'es-ES': 'Peso', 'fr-FR': 'Poids', 'de-DE': 'Gewicht' },
          optionSetSlug: 'weight_baby', tab: 'Physical', order: 2, unit: 'kg' 
        }),
        createField('eye_color', 'option_set', { 
          label: { 'en-US': 'Eye Color', 'es-ES': 'Color de Ojos', 'fr-FR': 'Couleur des yeux', 'de-DE': 'Augenfarbe' },
          optionSetSlug: 'eye_colors', tab: 'Physical', order: 3 
        }),
        createField('hair_color', 'option_set', { 
          label: { 'en-US': 'Hair Color', 'es-ES': 'Color de Cabello', 'fr-FR': 'Couleur des cheveux', 'de-DE': 'Haarfarbe' },
          optionSetSlug: 'hair_colors', tab: 'Physical', order: 4 
        }),
        createField('hair_type', 'option_set', { 
          optionSetSlug: 'hair_types', tab: 'Physical', order: 5 
        }),
        createField('skin_tone', 'option_set', { 
          optionSetSlug: 'skin_tones', tab: 'Physical', order: 6 
        }),

        // Guardian Information
        createField('primary_guardian_name', 'string', { 
          label: { 'en-US': 'Primary Guardian Name', 'es-ES': 'Nombre del Tutor Principal' },
          required: true, tab: 'Guardian Info', order: 1 
        }),
        createField('primary_guardian_relationship', 'option_set', { 
          label: { 'en-US': 'Relationship to Child', 'es-ES': 'Relación con el Niño' },
          optionSetSlug: 'guardian_relationships', required: true, tab: 'Guardian Info', order: 2 
        }),
        createField('primary_guardian_phone', 'phone', { 
          label: { 'en-US': 'Guardian Phone', 'es-ES': 'Teléfono del Tutor' },
          required: true, tab: 'Guardian Info', order: 3 
        }),
        createField('primary_guardian_email', 'email', { 
          label: { 'en-US': 'Guardian Email', 'es-ES': 'Email del Tutor' },
          required: true, tab: 'Guardian Info', order: 4 
        }),
        createField('emergency_contact_name', 'string', { 
          label: { 'en-US': 'Emergency Contact Name', 'es-ES': 'Nombre de Contacto de Emergencia' },
          required: true, tab: 'Guardian Info', order: 5 
        }),
        createField('emergency_contact_phone', 'phone', { 
          label: { 'en-US': 'Emergency Contact Phone', 'es-ES': 'Teléfono de Emergencia' },
          required: true, tab: 'Guardian Info', order: 6 
        }),

        // Legal & Compliance
        createField('work_permit', 'file', { 
          label: { 'en-US': 'Work Permit/Authorization', 'es-ES': 'Permiso de Trabajo' },
          required: true, tab: 'Legal', order: 1 
        }),
        createField('birth_certificate', 'file', { 
          label: { 'en-US': 'Birth Certificate', 'es-ES': 'Certificado de Nacimiento' },
          tab: 'Legal', order: 2 
        }),
        createField('guardian_consent', 'boolean', { 
          label: { 'en-US': 'Guardian Consent Given', 'es-ES': 'Consentimiento del Tutor Dado' },
          required: true, tab: 'Legal', order: 3 
        }),
        createField('medical_restrictions', 'text', { 
          label: { 'en-US': 'Medical Restrictions/Allergies', 'es-ES': 'Restricciones Médicas/Alergias' },
          tab: 'Legal', order: 4 
        }),

        // Availability
        createField('preferred_shoot_times', 'option_set', { 
          label: { 'en-US': 'Preferred Shoot Times', 'es-ES': 'Horarios Preferidos de Sesión' },
          optionSetSlug: 'baby_shoot_times', allowMultiple: true, tab: 'Availability', order: 1 
        }),
        createField('max_shoot_duration', 'option_set', { 
          label: { 'en-US': 'Maximum Shoot Duration', 'es-ES': 'Duración Máxima de Sesión' },
          optionSetSlug: 'baby_shoot_durations', tab: 'Availability', order: 2 
        }),
        createField('travel_restrictions', 'text', { 
          label: { 'en-US': 'Travel Restrictions', 'es-ES': 'Restricciones de Viaje' },
          tab: 'Availability', order: 3 
        })
      ]
    }
  },

  // Child Models (3-12 years)
  child_model: {
    type: 'profile',
    subType: 'child_model',
    displayName: {
      'en-US': 'Child Model',
      'es-ES': 'Modelo Infantil',
      'fr-FR': 'Modèle Enfant',
      'de-DE': 'Kindermodel'
    },
    description: {
      'en-US': 'Profile for child models aged 3-12 years with education and guardian coordination',
      'es-ES': 'Perfil para modelos infantiles de 3-12 años con coordinación educativa y de tutores'
    },
    isActive: true,
    schema: {
      fields: [
        // Basic Information
        createField('stage_name', 'string', { 
          label: { 'en-US': 'Stage/Professional Name', 'es-ES': 'Nombre Artístico' },
          tab: 'Basic Info', order: 1 
        }),
        createField('first_name', 'string', { required: true, tab: 'Basic Info', order: 2 }),
        createField('last_name', 'string', { required: true, tab: 'Basic Info', order: 3 }),
        createField('date_of_birth', 'date', { required: true, tab: 'Basic Info', order: 4 }),
        createField('gender', 'option_set', { optionSetSlug: 'genders', required: true, tab: 'Basic Info', order: 5 }),
        createField('nationality', 'option_set', { optionSetSlug: 'nationalities', tab: 'Basic Info', order: 6 }),
        createField('languages_spoken', 'option_set', { 
          optionSetSlug: 'accents_languages', allowMultiple: true, tab: 'Basic Info', order: 7 
        }),

        // Physical Characteristics
        createField('height', 'option_set', { 
          optionSetSlug: 'height_child', required: true, tab: 'Physical', order: 1, unit: 'cm' 
        }),
        createField('weight', 'option_set', { 
          optionSetSlug: 'weight_child', tab: 'Physical', order: 2, unit: 'kg' 
        }),
        createField('eye_color', 'option_set', { optionSetSlug: 'eye_colors', tab: 'Physical', order: 3 }),
        createField('hair_color', 'option_set', { optionSetSlug: 'hair_colors', tab: 'Physical', order: 4 }),
        createField('hair_type', 'option_set', { optionSetSlug: 'hair_types', tab: 'Physical', order: 5 }),
        createField('hair_length', 'option_set', { optionSetSlug: 'hair_lengths', tab: 'Physical', order: 6 }),
        createField('skin_tone', 'option_set', { optionSetSlug: 'skin_tones', tab: 'Physical', order: 7 }),
        createField('clothing_size', 'option_set', { 
          optionSetSlug: 'clothing_children', tab: 'Physical', order: 8 
        }),
        createField('shoe_size', 'option_set', { 
          optionSetSlug: 'shoe_sizes_children', tab: 'Physical', order: 9 
        }),

        // Skills & Experience
        createField('modeling_categories', 'option_set', { 
          optionSetSlug: 'modeling_categories', allowMultiple: true, tab: 'Experience', order: 1 
        }),
        createField('special_skills', 'option_set', { 
          optionSetSlug: 'child_special_skills', allowMultiple: true, tab: 'Experience', order: 2 
        }),
        createField('sports_activities', 'option_set', { 
          optionSetSlug: 'sports_activities', allowMultiple: true, tab: 'Experience', order: 3 
        }),
        createField('performance_experience', 'text', { 
          label: { 'en-US': 'Performance/Acting Experience', 'es-ES': 'Experiencia en Actuación' },
          tab: 'Experience', order: 4 
        }),
        createField('comfort_level_camera', 'option_set', { 
          label: { 'en-US': 'Comfort Level with Camera', 'es-ES': 'Nivel de Comodidad con Cámara' },
          optionSetSlug: 'comfort_levels', tab: 'Experience', order: 5 
        }),

        // Education & Schedule
        createField('school_name', 'string', { 
          label: { 'en-US': 'School Name', 'es-ES': 'Nombre de la Escuela' },
          tab: 'Education', order: 1 
        }),
        createField('grade_level', 'option_set', { 
          label: { 'en-US': 'Grade Level', 'es-ES': 'Nivel de Grado' },
          optionSetSlug: 'grade_levels', tab: 'Education', order: 2 
        }),
        createField('school_schedule', 'option_set', { 
          label: { 'en-US': 'School Schedule Type', 'es-ES': 'Tipo de Horario Escolar' },
          optionSetSlug: 'school_schedules', tab: 'Education', order: 3 
        }),
        createField('available_school_hours', 'boolean', { 
          label: { 'en-US': 'Available During School Hours', 'es-ES': 'Disponible Durante Horas Escolares' },
          tab: 'Education', order: 4 
        }),
        createField('tutoring_required', 'boolean', { 
          label: { 'en-US': 'On-Set Tutoring Required', 'es-ES': 'Tutoría en Set Requerida' },
          tab: 'Education', order: 5 
        }),

        // Guardian Information (same as baby model but with additions)
        createField('primary_guardian_name', 'string', { required: true, tab: 'Guardian Info', order: 1 }),
        createField('primary_guardian_relationship', 'option_set', { 
          optionSetSlug: 'guardian_relationships', required: true, tab: 'Guardian Info', order: 2 
        }),
        createField('primary_guardian_phone', 'phone', { required: true, tab: 'Guardian Info', order: 3 }),
        createField('primary_guardian_email', 'email', { required: true, tab: 'Guardian Info', order: 4 }),
        createField('guardian_can_accompany', 'boolean', { 
          label: { 'en-US': 'Guardian Can Accompany to Shoots', 'es-ES': 'Tutor Puede Acompañar a Sesiones' },
          tab: 'Guardian Info', order: 5 
        }),
        createField('approved_chaperones', 'text', { 
          label: { 'en-US': 'Approved Chaperones (Names & Contact)', 'es-ES': 'Acompañantes Aprobados' },
          tab: 'Guardian Info', order: 6 
        }),

        // Legal & Compliance
        createField('work_permit', 'file', { required: true, tab: 'Legal', order: 1 }),
        createField('coogan_account', 'boolean', { 
          label: { 'en-US': 'Coogan Account Established', 'es-ES': 'Cuenta Coogan Establecida' },
          tab: 'Legal', order: 2 
        }),
        createField('child_labor_compliance', 'boolean', { 
          label: { 'en-US': 'Child Labor Law Compliance Acknowledged', 'es-ES': 'Cumplimiento de Leyes de Trabajo Infantil' },
          required: true, tab: 'Legal', order: 3 
        }),
        createField('content_restrictions', 'option_set', { 
          label: { 'en-US': 'Content Restrictions', 'es-ES': 'Restricciones de Contenido' },
          optionSetSlug: 'content_restrictions', allowMultiple: true, tab: 'Legal', order: 4 
        })
      ]
    }
  },

  // Teen Models (13-17 years)
  teen_model: {
    type: 'profile',
    subType: 'teen_model',
    displayName: {
      'en-US': 'Teen Model',
      'es-ES': 'Modelo Adolescente',
      'fr-FR': 'Modèle Adolescent',
      'de-DE': 'Jugendmodel'
    },
    description: {
      'en-US': 'Profile for teen models aged 13-17 years with increasing independence',
      'es-ES': 'Perfil para modelos adolescentes de 13-17 años con creciente independencia'
    },
    isActive: true,
    schema: {
      fields: [
        // Basic Information (more independence)
        createField('stage_name', 'string', { tab: 'Basic Info', order: 1 }),
        createField('first_name', 'string', { required: true, tab: 'Basic Info', order: 2 }),
        createField('last_name', 'string', { required: true, tab: 'Basic Info', order: 3 }),
        createField('date_of_birth', 'date', { required: true, tab: 'Basic Info', order: 4 }),
        createField('gender', 'option_set', { optionSetSlug: 'genders', required: true, tab: 'Basic Info', order: 5 }),
        createField('nationality', 'option_set', { optionSetSlug: 'nationalities', tab: 'Basic Info', order: 6 }),
        createField('languages_spoken', 'option_set', { 
          optionSetSlug: 'accents_languages', allowMultiple: true, tab: 'Basic Info', order: 7 
        }),
        createField('social_media_comfortable', 'boolean', { 
          label: { 'en-US': 'Comfortable with Social Media Promotion', 'es-ES': 'Cómodo con Promoción en Redes Sociales' },
          tab: 'Basic Info', order: 8 
        }),

        // Physical Characteristics (more detailed)
        createField('height', 'option_set', { 
          optionSetSlug: 'height_teen', required: true, tab: 'Measurements', order: 1, unit: 'cm' 
        }),
        createField('weight', 'option_set', { 
          optionSetSlug: 'weight_adult', tab: 'Measurements', order: 2, unit: 'kg' 
        }),
        createField('chest_bust', 'option_set', { 
          optionSetSlug: 'chest_bust', tab: 'Measurements', order: 3, unit: 'cm' 
        }),
        createField('waist', 'option_set', { 
          optionSetSlug: 'waist', tab: 'Measurements', order: 4, unit: 'cm' 
        }),
        createField('hips', 'option_set', { 
          optionSetSlug: 'hips', tab: 'Measurements', order: 5, unit: 'cm' 
        }),
        createField('clothing_size_women', 'option_set', { 
          optionSetSlug: 'clothing_women', tab: 'Measurements', order: 6 
        }),
        createField('clothing_size_men', 'option_set', { 
          optionSetSlug: 'clothing_men', tab: 'Measurements', order: 7 
        }),
        createField('shoe_size', 'option_set', { 
          optionSetSlug: 'shoe_sizes_adult', tab: 'Measurements', order: 8 
        }),

        // Appearance
        createField('eye_color', 'option_set', { optionSetSlug: 'eye_colors', tab: 'Appearance', order: 1 }),
        createField('hair_color', 'option_set', { optionSetSlug: 'hair_colors', tab: 'Appearance', order: 2 }),
        createField('hair_type', 'option_set', { optionSetSlug: 'hair_types', tab: 'Appearance', order: 3 }),
        createField('hair_length', 'option_set', { optionSetSlug: 'hair_lengths', tab: 'Appearance', order: 4 }),
        createField('skin_tone', 'option_set', { optionSetSlug: 'skin_tones', tab: 'Appearance', order: 5 }),
        createField('tattoos', 'boolean', { 
          label: { 'en-US': 'Has Tattoos', 'es-ES': 'Tiene Tatuajes' },
          tab: 'Appearance', order: 6 
        }),
        createField('piercings', 'boolean', { 
          label: { 'en-US': 'Has Piercings', 'es-ES': 'Tiene Perforaciones' },
          tab: 'Appearance', order: 7 
        }),
        createField('willing_to_dye_hair', 'boolean', { 
          label: { 'en-US': 'Willing to Dye Hair', 'es-ES': 'Dispuesto a Teñir Cabello' },
          tab: 'Appearance', order: 8 
        }),

        // Experience & Skills (expanding capabilities)
        createField('modeling_categories', 'option_set', { 
          optionSetSlug: 'modeling_categories', allowMultiple: true, tab: 'Experience', order: 1 
        }),
        createField('experience_level', 'option_set', { 
          optionSetSlug: 'experience_levels', tab: 'Experience', order: 2 
        }),
        createField('acting_experience', 'text', { tab: 'Experience', order: 3 }),
        createField('dance_styles', 'option_set', { 
          optionSetSlug: 'dance_styles', allowMultiple: true, tab: 'Experience', order: 4 
        }),
        createField('sports_activities', 'option_set', { 
          optionSetSlug: 'sports_activities', allowMultiple: true, tab: 'Experience', order: 5 
        }),
        createField('special_skills', 'option_set', { 
          optionSetSlug: 'teen_special_skills', allowMultiple: true, tab: 'Experience', order: 6 
        }),

        // Education continues to be important
        createField('school_status', 'option_set', { 
          optionSetSlug: 'school_status', tab: 'Education', order: 1 
        }),
        createField('grade_level', 'option_set', { optionSetSlug: 'grade_levels', tab: 'Education', order: 2 }),
        createField('academic_schedule_flexibility', 'option_set', { 
          optionSetSlug: 'schedule_flexibility', tab: 'Education', order: 3 
        }),

        // Guardian info still required but transitioning
        createField('primary_guardian_name', 'string', { required: true, tab: 'Guardian Info', order: 1 }),
        createField('guardian_approval_required', 'boolean', { 
          label: { 'en-US': 'Guardian Approval Required for Bookings', 'es-ES': 'Aprobación del Tutor Requerida' },
          required: true, tab: 'Guardian Info', order: 2 
        }),
        createField('can_work_independently', 'boolean', { 
          label: { 'en-US': 'Can Work on Set Independently', 'es-ES': 'Puede Trabajar en Set Independientemente' },
          tab: 'Guardian Info', order: 3 
        }),

        // Legal
        createField('work_permit', 'file', { required: true, tab: 'Legal', order: 1 }),
        createField('content_comfort_level', 'option_set', { 
          optionSetSlug: 'content_comfort_levels', tab: 'Legal', order: 2 
        })
      ]
    }
  },

  // Adult Fashion Model (18+ years)
  adult_fashion_model: {
    type: 'profile',
    subType: 'adult_fashion_model',
    displayName: {
      'en-US': 'Fashion Model',
      'es-ES': 'Modelo de Moda',
      'fr-FR': 'Mannequin de Mode',
      'de-DE': 'Fashion-Model'
    },
    description: {
      'en-US': 'Professional fashion model profile for runway, editorial, and commercial work',
      'es-ES': 'Perfil de modelo de moda profesional para pasarela, editorial y trabajo comercial'
    },
    isActive: true,
    schema: {
      fields: [
        // Professional Identity
        createField('stage_name', 'string', { 
          label: { 'en-US': 'Professional/Stage Name', 'es-ES': 'Nombre Profesional/Artístico' },
          tab: 'Professional', order: 1 
        }),
        createField('first_name', 'string', { required: true, tab: 'Professional', order: 2 }),
        createField('last_name', 'string', { required: true, tab: 'Professional', order: 3 }),
        createField('date_of_birth', 'date', { required: true, tab: 'Professional', order: 4 }),
        createField('gender', 'option_set', { optionSetSlug: 'genders', required: true, tab: 'Professional', order: 5 }),
        createField('nationality', 'option_set', { optionSetSlug: 'nationalities', tab: 'Professional', order: 6 }),
        createField('work_authorization', 'option_set', { 
          optionSetSlug: 'work_authorization_status', required: true, tab: 'Professional', order: 7 
        }),
        createField('languages_spoken', 'option_set', { 
          optionSetSlug: 'accents_languages', allowMultiple: true, tab: 'Professional', order: 8 
        }),
        createField('union_status', 'option_set', { 
          optionSetSlug: 'union_status', tab: 'Professional', order: 9 
        }),

        // Measurements (critical for fashion)
        createField('height', 'option_set', { 
          optionSetSlug: 'height_adult', required: true, tab: 'Measurements', order: 1, unit: 'cm' 
        }),
        createField('weight', 'option_set', { 
          optionSetSlug: 'weight_adult', tab: 'Measurements', order: 2, unit: 'kg' 
        }),
        createField('chest_bust', 'option_set', { 
          optionSetSlug: 'chest_bust', required: true, tab: 'Measurements', order: 3, unit: 'cm' 
        }),
        createField('waist', 'option_set', { 
          optionSetSlug: 'waist', required: true, tab: 'Measurements', order: 4, unit: 'cm' 
        }),
        createField('hips', 'option_set', { 
          optionSetSlug: 'hips', required: true, tab: 'Measurements', order: 5, unit: 'cm' 
        }),
        createField('dress_size', 'option_set', { 
          optionSetSlug: 'clothing_women', tab: 'Measurements', order: 6 
        }),
        createField('suit_size', 'option_set', { 
          optionSetSlug: 'clothing_men', tab: 'Measurements', order: 7 
        }),
        createField('shoe_size', 'option_set', { 
          optionSetSlug: 'shoe_sizes_adult', required: true, tab: 'Measurements', order: 8 
        }),
        createField('inseam', 'number', { 
          label: { 'en-US': 'Inseam Length', 'es-ES': 'Largo de Entrepierna' },
          tab: 'Measurements', order: 9, unit: 'cm' 
        }),

        // Appearance Details
        createField('eye_color', 'option_set', { optionSetSlug: 'eye_colors', tab: 'Appearance', order: 1 }),
        createField('hair_color', 'option_set', { optionSetSlug: 'hair_colors', tab: 'Appearance', order: 2 }),
        createField('hair_type', 'option_set', { optionSetSlug: 'hair_types', tab: 'Appearance', order: 3 }),
        createField('hair_length', 'option_set', { optionSetSlug: 'hair_lengths', tab: 'Appearance', order: 4 }),
        createField('skin_tone', 'option_set', { optionSetSlug: 'skin_tones', tab: 'Appearance', order: 5 }),
        createField('distinctive_features', 'text', { 
          label: { 'en-US': 'Distinctive Features/Marks', 'es-ES': 'Características Distintivas/Marcas' },
          tab: 'Appearance', order: 6 
        }),
        createField('tattoos', 'boolean', { tab: 'Appearance', order: 7 }),
        createField('piercings', 'boolean', { tab: 'Appearance', order: 8 }),
        createField('willing_to_alter_appearance', 'option_set', { 
          label: { 'en-US': 'Willing to Alter Appearance', 'es-ES': 'Dispuesto a Alterar Apariencia' },
          optionSetSlug: 'appearance_flexibility', allowMultiple: true, tab: 'Appearance', order: 9 
        }),

        // Specializations
        createField('modeling_categories', 'option_set', { 
          optionSetSlug: 'modeling_categories', allowMultiple: true, required: true, tab: 'Specializations', order: 1 
        }),
        createField('runway_experience', 'boolean', { 
          label: { 'en-US': 'Runway/Catwalk Experience', 'es-ES': 'Experiencia en Pasarela' },
          tab: 'Specializations', order: 2 
        }),
        createField('print_experience', 'boolean', { 
          label: { 'en-US': 'Print/Editorial Experience', 'es-ES': 'Experiencia en Impreso/Editorial' },
          tab: 'Specializations', order: 3 
        }),
        createField('commercial_experience', 'boolean', { 
          label: { 'en-US': 'Commercial Modeling Experience', 'es-ES': 'Experiencia en Modelaje Comercial' },
          tab: 'Specializations', order: 4 
        }),
        createField('high_fashion_experience', 'boolean', { 
          label: { 'en-US': 'High Fashion Experience', 'es-ES': 'Experiencia en Alta Moda' },
          tab: 'Specializations', order: 5 
        }),
        createField('preferred_styles', 'option_set', { 
          optionSetSlug: 'fashion_styles', allowMultiple: true, tab: 'Specializations', order: 6 
        }),

        // Professional Details
        createField('experience_level', 'option_set', { 
          optionSetSlug: 'experience_levels', required: true, tab: 'Professional', order: 10 
        }),
        createField('agency_representation', 'string', { 
          label: { 'en-US': 'Current Agency Representation', 'es-ES': 'Representación de Agencia Actual' },
          tab: 'Professional', order: 11 
        }),
        createField('portfolio_url', 'url', { 
          label: { 'en-US': 'Portfolio Website/URL', 'es-ES': 'Sitio Web/URL de Portafolio' },
          tab: 'Professional', order: 12 
        }),
        createField('social_media_following', 'option_set', { 
          label: { 'en-US': 'Social Media Following Size', 'es-ES': 'Tamaño de Seguidores en Redes Sociales' },
          optionSetSlug: 'social_media_following', tab: 'Professional', order: 13 
        }),

        // Availability & Logistics
        createField('availability_type', 'option_set', { 
          optionSetSlug: 'availability_types', tab: 'Availability', order: 1 
        }),
        createField('travel_willingness', 'option_set', { 
          optionSetSlug: 'travel_willingness', tab: 'Availability', order: 2 
        }),
        createField('notice_requirement', 'option_set', { 
          optionSetSlug: 'notice_requirements', tab: 'Availability', order: 3 
        }),
        createField('rate_range', 'option_set', { 
          optionSetSlug: 'model_rate_ranges', tab: 'Availability', order: 4 
        }),
        createField('preferred_shoot_types', 'option_set', { 
          optionSetSlug: 'shoot_types', allowMultiple: true, tab: 'Availability', order: 5 
        })
      ]
    }
  },

  // Fitness Model
  fitness_model: {
    type: 'profile',
    subType: 'fitness_model',
    displayName: {
      'en-US': 'Fitness Model',
      'es-ES': 'Modelo de Fitness',
      'fr-FR': 'Modèle Fitness',
      'de-DE': 'Fitness-Model'
    },
    description: {
      'en-US': 'Athletic and fitness modeling profile with performance metrics and specializations',
      'es-ES': 'Perfil de modelaje atlético y fitness con métricas de rendimiento y especializaciones'
    },
    isActive: true,
    schema: {
      fields: [
        // Professional Identity (same base as fashion model)
        createField('stage_name', 'string', { tab: 'Professional', order: 1 }),
        createField('first_name', 'string', { required: true, tab: 'Professional', order: 2 }),
        createField('last_name', 'string', { required: true, tab: 'Professional', order: 3 }),
        createField('date_of_birth', 'date', { required: true, tab: 'Professional', order: 4 }),
        createField('gender', 'option_set', { optionSetSlug: 'genders', required: true, tab: 'Professional', order: 5 }),

        // Fitness-Specific Measurements
        createField('height', 'option_set', { 
          optionSetSlug: 'height_adult', required: true, tab: 'Measurements', order: 1, unit: 'cm' 
        }),
        createField('weight', 'option_set', { 
          optionSetSlug: 'weight_adult', required: true, tab: 'Measurements', order: 2, unit: 'kg' 
        }),
        createField('body_fat_percentage', 'option_set', { 
          label: { 'en-US': 'Body Fat Percentage', 'es-ES': 'Porcentaje de Grasa Corporal' },
          optionSetSlug: 'body_fat_percentages', tab: 'Measurements', order: 3, unit: '%' 
        }),
        createField('muscle_mass_percentage', 'option_set', { 
          label: { 'en-US': 'Muscle Mass Percentage', 'es-ES': 'Porcentaje de Masa Muscular' },
          optionSetSlug: 'muscle_mass_percentages', tab: 'Measurements', order: 4, unit: '%' 
        }),
        createField('chest_bust', 'option_set', { optionSetSlug: 'chest_bust', tab: 'Measurements', order: 5, unit: 'cm' }),
        createField('waist', 'option_set', { optionSetSlug: 'waist', tab: 'Measurements', order: 6, unit: 'cm' }),
        createField('hips', 'option_set', { optionSetSlug: 'hips', tab: 'Measurements', order: 7, unit: 'cm' }),
        createField('bicep', 'number', { 
          label: { 'en-US': 'Bicep Circumference', 'es-ES': 'Circunferencia del Bícep' },
          tab: 'Measurements', order: 8, unit: 'cm' 
        }),
        createField('thigh', 'number', { 
          label: { 'en-US': 'Thigh Circumference', 'es-ES': 'Circunferencia del Muslo' },
          tab: 'Measurements', order: 9, unit: 'cm' 
        }),

        // Fitness Specializations
        createField('fitness_specialties', 'option_set', { 
          optionSetSlug: 'fitness_specialties', allowMultiple: true, required: true, tab: 'Specializations', order: 1 
        }),
        createField('competition_categories', 'option_set', { 
          label: { 'en-US': 'Competition Categories', 'es-ES': 'Categorías de Competencia' },
          optionSetSlug: 'fitness_competition_categories', allowMultiple: true, tab: 'Specializations', order: 2 
        }),
        createField('training_style', 'option_set', { 
          label: { 'en-US': 'Primary Training Style', 'es-ES': 'Estilo de Entrenamiento Principal' },
          optionSetSlug: 'training_styles', tab: 'Specializations', order: 3 
        }),
        createField('years_training', 'option_set', { 
          label: { 'en-US': 'Years of Training', 'es-ES': 'Años de Entrenamiento' },
          optionSetSlug: 'training_experience', tab: 'Specializations', order: 4 
        }),

        // Certifications & Achievements
        createField('fitness_certifications', 'option_set', { 
          label: { 'en-US': 'Fitness Certifications', 'es-ES': 'Certificaciones de Fitness' },
          optionSetSlug: 'fitness_certifications', allowMultiple: true, tab: 'Achievements', order: 1 
        }),
        createField('competition_history', 'text', { 
          label: { 'en-US': 'Competition History & Placements', 'es-ES': 'Historial de Competencias y Posiciones' },
          tab: 'Achievements', order: 2 
        }),
        createField('notable_achievements', 'text', { 
          label: { 'en-US': 'Notable Achievements/Awards', 'es-ES': 'Logros/Premios Notables' },
          tab: 'Achievements', order: 3 
        }),
        createField('sponsored_athlete', 'boolean', { 
          label: { 'en-US': 'Sponsored Athlete', 'es-ES': 'Atleta Patrocinado' },
          tab: 'Achievements', order: 4 
        }),
        createField('sponsorships', 'text', { 
          label: { 'en-US': 'Current Sponsorships/Endorsements', 'es-ES': 'Patrocinios/Endorsos Actuales' },
          tab: 'Achievements', order: 5 
        }),

        // Performance Metrics
        createField('max_bench_press', 'number', { 
          label: { 'en-US': 'Max Bench Press', 'es-ES': 'Press de Banca Máximo' },
          tab: 'Performance', order: 1, unit: 'kg' 
        }),
        createField('max_squat', 'number', { 
          label: { 'en-US': 'Max Squat', 'es-ES': 'Sentadilla Máxima' },
          tab: 'Performance', order: 2, unit: 'kg' 
        }),
        createField('max_deadlift', 'number', { 
          label: { 'en-US': 'Max Deadlift', 'es-ES': 'Peso Muerto Máximo' },
          tab: 'Performance', order: 3, unit: 'kg' 
        }),
        createField('mile_time', 'string', { 
          label: { 'en-US': 'Mile Run Time', 'es-ES': 'Tiempo de Milla' },
          tab: 'Performance', order: 4 
        }),
        createField('flexibility_level', 'option_set', { 
          label: { 'en-US': 'Flexibility Level', 'es-ES': 'Nivel de Flexibilidad' },
          optionSetSlug: 'flexibility_levels', tab: 'Performance', order: 5 
        }),

        // Diet & Lifestyle
        createField('diet_type', 'option_set', { 
          label: { 'en-US': 'Diet Type/Restrictions', 'es-ES': 'Tipo de Dieta/Restricciones' },
          optionSetSlug: 'diet_types', tab: 'Lifestyle', order: 1 
        }),
        createField('supplement_use', 'option_set', { 
          label: { 'en-US': 'Supplement Use', 'es-ES': 'Uso de Suplementos' },
          optionSetSlug: 'supplement_categories', allowMultiple: true, tab: 'Lifestyle', order: 2 
        }),
        createField('lifestyle_habits', 'option_set', { 
          label: { 'en-US': 'Lifestyle Habits', 'es-ES': 'Hábitos de Estilo de Vida' },
          optionSetSlug: 'lifestyle_habits', allowMultiple: true, tab: 'Lifestyle', order: 3 
        }),

        // Appearance (fitness-focused)
        createField('eye_color', 'option_set', { optionSetSlug: 'eye_colors', tab: 'Appearance', order: 1 }),
        createField('hair_color', 'option_set', { optionSetSlug: 'hair_colors', tab: 'Appearance', order: 2 }),
        createField('skin_tone', 'option_set', { optionSetSlug: 'skin_tones', tab: 'Appearance', order: 3 }),
        createField('tattoos', 'boolean', { tab: 'Appearance', order: 4 }),
        createField('visible_abs', 'boolean', { 
          label: { 'en-US': 'Visible Abdominal Definition', 'es-ES': 'Definición Abdominal Visible' },
          tab: 'Appearance', order: 5 
        }),
        createField('vascularity', 'option_set', { 
          label: { 'en-US': 'Vascularity Level', 'es-ES': 'Nivel de Vascularidad' },
          optionSetSlug: 'vascularity_levels', tab: 'Appearance', order: 6 
        }),

        // Professional (same availability structure as other models)
        createField('experience_level', 'option_set', { optionSetSlug: 'experience_levels', tab: 'Professional', order: 1 }),
        createField('availability_type', 'option_set', { optionSetSlug: 'availability_types', tab: 'Availability', order: 1 }),
        createField('travel_willingness', 'option_set', { optionSetSlug: 'travel_willingness', tab: 'Availability', order: 2 })
      ]
    }
  },

  // ===========================================
  // VOICE TALENT SCHEMAS
  // ===========================================

  voice_talent: {
    type: 'profile',
    subType: 'voice_talent',
    displayName: {
      'en-US': 'Voice Talent',
      'es-ES': 'Talento de Voz',
      'fr-FR': 'Talent Vocal',
      'de-DE': 'Sprecher'
    },
    description: {
      'en-US': 'Professional voice talent for commercials, narration, character work, and audio production',
      'es-ES': 'Talento de voz profesional para comerciales, narración, trabajo de personajes y producción de audio'
    },
    isActive: true,
    schema: {
      fields: [
        // Professional Identity
        createField('stage_name', 'string', { tab: 'Professional', order: 1 }),
        createField('first_name', 'string', { required: true, tab: 'Professional', order: 2 }),
        createField('last_name', 'string', { required: true, tab: 'Professional', order: 3 }),
        createField('date_of_birth', 'date', { required: true, tab: 'Professional', order: 4 }),
        createField('gender', 'option_set', { optionSetSlug: 'genders', required: true, tab: 'Professional', order: 5 }),
        createField('nationality', 'option_set', { optionSetSlug: 'nationalities', tab: 'Professional', order: 6 }),

        // Voice Characteristics
        createField('voice_type', 'option_set', { 
          optionSetSlug: 'voice_types', required: true, tab: 'Voice Profile', order: 1 
        }),
        createField('voice_age_range', 'option_set', { 
          optionSetSlug: 'voice_ages', allowMultiple: true, required: true, tab: 'Voice Profile', order: 2 
        }),
        createField('vocal_range', 'option_set', { 
          label: { 'en-US': 'Vocal Range (Musical)', 'es-ES': 'Rango Vocal (Musical)' },
          optionSetSlug: 'vocal_ranges', tab: 'Voice Profile', order: 3 
        }),
        createField('voice_tone', 'option_set', { 
          label: { 'en-US': 'Voice Tone Characteristics', 'es-ES': 'Características del Tono de Voz' },
          optionSetSlug: 'voice_tones', allowMultiple: true, tab: 'Voice Profile', order: 4 
        }),
        createField('voice_pace', 'option_set', { 
          label: { 'en-US': 'Natural Speaking Pace', 'es-ES': 'Ritmo Natural de Habla' },
          optionSetSlug: 'voice_paces', tab: 'Voice Profile', order: 5 
        }),

        // Languages & Accents
        createField('native_language', 'option_set', { 
          label: { 'en-US': 'Native Language', 'es-ES': 'Idioma Nativo' },
          optionSetSlug: 'accents_languages', required: true, tab: 'Languages', order: 1 
        }),
        createField('additional_languages', 'option_set', { 
          label: { 'en-US': 'Additional Languages (Fluent)', 'es-ES': 'Idiomas Adicionales (Fluido)' },
          optionSetSlug: 'accents_languages', allowMultiple: true, tab: 'Languages', order: 2 
        }),
        createField('accents_specialties', 'option_set', { 
          label: { 'en-US': 'Accent Specialties', 'es-ES': 'Especialidades de Acento' },
          optionSetSlug: 'accents_languages', allowMultiple: true, tab: 'Languages', order: 3 
        }),
        createField('dialect_coaching', 'boolean', { 
          label: { 'en-US': 'Available for Dialect Coaching', 'es-ES': 'Disponible para Entrenamiento de Dialecto' },
          tab: 'Languages', order: 4 
        }),

        // Voice Acting Styles & Specializations
        createField('voice_styles', 'option_set', { 
          optionSetSlug: 'voice_styles', allowMultiple: true, required: true, tab: 'Specializations', order: 1 
        }),
        createField('character_voices', 'text', { 
          label: { 'en-US': 'Character Voice Descriptions', 'es-ES': 'Descripciones de Voces de Personajes' },
          tab: 'Specializations', order: 2 
        }),
        createField('industry_experience', 'option_set', { 
          label: { 'en-US': 'Industry Experience', 'es-ES': 'Experiencia en la Industria' },
          optionSetSlug: 'voice_industry_types', allowMultiple: true, tab: 'Specializations', order: 3 
        }),
        createField('singing_ability', 'option_set', { 
          label: { 'en-US': 'Singing Ability', 'es-ES': 'Habilidad de Canto' },
          optionSetSlug: 'singing_levels', tab: 'Specializations', order: 4 
        }),
        createField('musical_genres', 'option_set', { 
          label: { 'en-US': 'Musical Genres (if applicable)', 'es-ES': 'Géneros Musicales (si aplica)' },
          optionSetSlug: 'musical_genres', allowMultiple: true, tab: 'Specializations', order: 5 
        }),

        // Technical Capabilities
        createField('home_studio', 'boolean', { 
          label: { 'en-US': 'Has Professional Home Studio', 'es-ES': 'Tiene Estudio Casero Profesional' },
          required: true, tab: 'Technical', order: 1 
        }),
        createField('studio_equipment', 'option_set', { 
          label: { 'en-US': 'Studio Equipment', 'es-ES': 'Equipo de Estudio' },
          optionSetSlug: 'audio_equipment', allowMultiple: true, tab: 'Technical', order: 2 
        }),
        createField('recording_software', 'option_set', { 
          label: { 'en-US': 'Recording Software Proficiency', 'es-ES': 'Competencia en Software de Grabación' },
          optionSetSlug: 'audio_software', allowMultiple: true, tab: 'Technical', order: 3 
        }),
        createField('editing_skills', 'option_set', { 
          label: { 'en-US': 'Audio Editing Skills', 'es-ES': 'Habilidades de Edición de Audio' },
          optionSetSlug: 'editing_skill_levels', tab: 'Technical', order: 4 
        }),
        createField('delivery_formats', 'option_set', { 
          label: { 'en-US': 'Available Delivery Formats', 'es-ES': 'Formatos de Entrega Disponibles' },
          optionSetSlug: 'audio_formats', allowMultiple: true, tab: 'Technical', order: 5 
        }),
        createField('turnaround_time', 'option_set', { 
          label: { 'en-US': 'Standard Turnaround Time', 'es-ES': 'Tiempo de Entrega Estándar' },
          optionSetSlug: 'turnaround_times', tab: 'Technical', order: 6 
        }),

        // Professional Experience
        createField('experience_level', 'option_set', { optionSetSlug: 'experience_levels', tab: 'Professional', order: 7 }),
        createField('union_status', 'option_set', { optionSetSlug: 'union_status', tab: 'Professional', order: 8 }),
        createField('notable_clients', 'text', { 
          label: { 'en-US': 'Notable Clients/Projects', 'es-ES': 'Clientes/Proyectos Notables' },
          tab: 'Professional', order: 9 
        }),
        createField('demo_reel_url', 'url', { 
          label: { 'en-US': 'Demo Reel URL', 'es-ES': 'URL de Demo Reel' },
          tab: 'Professional', order: 10 
        }),

        // Availability & Rates
        createField('availability_type', 'option_set', { optionSetSlug: 'availability_types', tab: 'Availability', order: 1 }),
        createField('time_zone', 'option_set', { 
          label: { 'en-US': 'Time Zone', 'es-ES': 'Zona Horaria' },
          optionSetSlug: 'time_zones', tab: 'Availability', order: 2 
        }),
        createField('recording_hours', 'option_set', { 
          label: { 'en-US': 'Available Recording Hours', 'es-ES': 'Horas de Grabación Disponibles' },
          optionSetSlug: 'recording_hours', tab: 'Availability', order: 3 
        }),
        createField('rate_structure', 'option_set', { 
          label: { 'en-US': 'Rate Structure Preference', 'es-ES': 'Preferencia de Estructura de Tarifas' },
          optionSetSlug: 'voice_rate_structures', tab: 'Availability', order: 4 
        })
      ]
    }
  },

  // ===========================================
  // PET MODEL SCHEMAS
  // ===========================================

  pet_model: {
    type: 'profile',
    subType: 'pet_model',
    displayName: {
      'en-US': 'Pet Model',
      'es-ES': 'Modelo de Mascota',
      'fr-FR': 'Modèle Animal',
      'de-DE': 'Tiermodel'
    },
    description: {
      'en-US': 'Professional pet model profile for commercial, film, and advertising work',
      'es-ES': 'Perfil de modelo de mascota profesional para trabajo comercial, cinematográfico y publicitario'
    },
    isActive: true,
    schema: {
      fields: [
        // Basic Pet Information
        createField('pet_name', 'string', { 
          label: { 'en-US': 'Pet Name', 'es-ES': 'Nombre de la Mascota' },
          required: true, tab: 'Basic Info', order: 1 
        }),
        createField('species', 'option_set', { 
          optionSetSlug: 'pet_species', required: true, tab: 'Basic Info', order: 2 
        }),
        createField('breed', 'option_set', { 
          label: { 'en-US': 'Breed (if applicable)', 'es-ES': 'Raza (si aplica)' },
          optionSetSlug: 'pet_breeds', tab: 'Basic Info', order: 3 
        }),
        createField('date_of_birth', 'date', { 
          label: { 'en-US': 'Date of Birth/Age', 'es-ES': 'Fecha de Nacimiento/Edad' },
          required: true, tab: 'Basic Info', order: 4 
        }),
        createField('gender', 'option_set', { 
          optionSetSlug: 'pet_genders', required: true, tab: 'Basic Info', order: 5 
        }),
        createField('neutered_spayed', 'boolean', { 
          label: { 'en-US': 'Neutered/Spayed', 'es-ES': 'Castrado/Esterilizado' },
          tab: 'Basic Info', order: 6 
        }),

        // Physical Characteristics
        createField('size_category', 'option_set', { 
          optionSetSlug: 'pet_sizes', required: true, tab: 'Physical', order: 1 
        }),
        createField('weight', 'number', { 
          label: { 'en-US': 'Weight', 'es-ES': 'Peso' },
          tab: 'Physical', order: 2, unit: 'kg' 
        }),
        createField('height', 'number', { 
          label: { 'en-US': 'Height (at shoulder)', 'es-ES': 'Altura (al hombro)' },
          tab: 'Physical', order: 3, unit: 'cm' 
        }),
        createField('length', 'number', { 
          label: { 'en-US': 'Length (nose to tail)', 'es-ES': 'Longitud (nariz a cola)' },
          tab: 'Physical', order: 4, unit: 'cm' 
        }),
        createField('coat_color', 'option_set', { 
          label: { 'en-US': 'Coat/Fur Color', 'es-ES': 'Color de Pelaje' },
          optionSetSlug: 'pet_colors', allowMultiple: true, tab: 'Physical', order: 5 
        }),
        createField('coat_pattern', 'option_set', { 
          label: { 'en-US': 'Coat Pattern', 'es-ES': 'Patrón de Pelaje' },
          optionSetSlug: 'coat_patterns', tab: 'Physical', order: 6 
        }),
        createField('coat_length', 'option_set', { 
          label: { 'en-US': 'Coat Length', 'es-ES': 'Longitud del Pelaje' },
          optionSetSlug: 'coat_lengths', tab: 'Physical', order: 7 
        }),
        createField('eye_color', 'option_set', { 
          optionSetSlug: 'pet_eye_colors', tab: 'Physical', order: 8 
        }),
        createField('distinctive_features', 'text', { 
          label: { 'en-US': 'Distinctive Features/Markings', 'es-ES': 'Características/Marcas Distintivas' },
          tab: 'Physical', order: 9 
        }),

        // Temperament & Behavior
        createField('temperament', 'option_set', { 
          optionSetSlug: 'pet_temperaments', allowMultiple: true, required: true, tab: 'Behavior', order: 1 
        }),
        createField('energy_level', 'option_set', { 
          label: { 'en-US': 'Energy Level', 'es-ES': 'Nivel de Energía' },
          optionSetSlug: 'energy_levels', tab: 'Behavior', order: 2 
        }),
        createField('socialization', 'option_set', { 
          label: { 'en-US': 'Socialization Level', 'es-ES': 'Nivel de Socialización' },
          optionSetSlug: 'socialization_levels', allowMultiple: true, tab: 'Behavior', order: 3 
        }),
        createField('noise_level', 'option_set', { 
          label: { 'en-US': 'Noise Level (Barking, etc.)', 'es-ES': 'Nivel de Ruido (Ladridos, etc.)' },
          optionSetSlug: 'noise_levels', tab: 'Behavior', order: 4 
        }),
        createField('attention_span', 'option_set', { 
          label: { 'en-US': 'Attention Span for Training', 'es-ES': 'Capacidad de Atención para Entrenamiento' },
          optionSetSlug: 'attention_spans', tab: 'Behavior', order: 5 
        }),

        // Skills & Training
        createField('trained_skills', 'option_set', { 
          optionSetSlug: 'pet_skills', allowMultiple: true, required: true, tab: 'Skills', order: 1 
        }),
        createField('obedience_level', 'option_set', { 
          label: { 'en-US': 'Obedience Training Level', 'es-ES': 'Nivel de Entrenamiento de Obediencia' },
          optionSetSlug: 'obedience_levels', tab: 'Skills', order: 2 
        }),
        createField('trick_repertoire', 'text', { 
          label: { 'en-US': 'Specific Tricks & Commands', 'es-ES': 'Trucos y Comandos Específicos' },
          tab: 'Skills', order: 3 
        }),
        createField('can_work_with_props', 'boolean', { 
          label: { 'en-US': 'Can Work with Props/Products', 'es-ES': 'Puede Trabajar con Accesorios/Productos' },
          tab: 'Skills', order: 4 
        }),
        createField('costume_tolerance', 'option_set', { 
          label: { 'en-US': 'Tolerance for Costumes/Accessories', 'es-ES': 'Tolerancia a Disfraces/Accesorios' },
          optionSetSlug: 'costume_tolerance_levels', tab: 'Skills', order: 5 
        }),
        createField('water_comfort', 'option_set', { 
          label: { 'en-US': 'Comfort Level with Water', 'es-ES': 'Nivel de Comodidad con Agua' },
          optionSetSlug: 'water_comfort_levels', tab: 'Skills', order: 6 
        }),

        // Health & Veterinary
        createField('health_status', 'option_set', { 
          label: { 'en-US': 'Overall Health Status', 'es-ES': 'Estado de Salud General' },
          optionSetSlug: 'health_statuses', required: true, tab: 'Health', order: 1 
        }),
        createField('vaccinations_current', 'boolean', { 
          label: { 'en-US': 'Vaccinations Up to Date', 'es-ES': 'Vacunas al Día' },
          required: true, tab: 'Health', order: 2 
        }),
        createField('health_certificates', 'file', { 
          label: { 'en-US': 'Health Certificates/Vet Records', 'es-ES': 'Certificados de Salud/Registros Veterinarios' },
          tab: 'Health', order: 3 
        }),
        createField('dietary_restrictions', 'text', { 
          label: { 'en-US': 'Dietary Restrictions/Allergies', 'es-ES': 'Restricciones Dietéticas/Alergias' },
          tab: 'Health', order: 4 
        }),
        createField('medications', 'text', { 
          label: { 'en-US': 'Current Medications', 'es-ES': 'Medicamentos Actuales' },
          tab: 'Health', order: 5 
        }),
        createField('insurance_coverage', 'boolean', { 
          label: { 'en-US': 'Has Pet Insurance Coverage', 'es-ES': 'Tiene Seguro de Mascota' },
          tab: 'Health', order: 6 
        }),

        // Owner/Handler Information
        createField('owner_name', 'string', { 
          label: { 'en-US': 'Owner/Primary Handler Name', 'es-ES': 'Nombre del Dueño/Cuidador Principal' },
          required: true, tab: 'Handler Info', order: 1 
        }),
        createField('owner_phone', 'phone', { 
          label: { 'en-US': 'Owner Phone', 'es-ES': 'Teléfono del Dueño' },
          required: true, tab: 'Handler Info', order: 2 
        }),
        createField('owner_email', 'email', { 
          label: { 'en-US': 'Owner Email', 'es-ES': 'Email del Dueño' },
          required: true, tab: 'Handler Info', order: 3 
        }),
        createField('professional_handler', 'boolean', { 
          label: { 'en-US': 'Works with Professional Animal Handler', 'es-ES': 'Trabaja con Cuidador de Animales Profesional' },
          tab: 'Handler Info', order: 4 
        }),
        createField('handler_experience', 'option_set', { 
          label: { 'en-US': 'Handler\'s Experience Level', 'es-ES': 'Nivel de Experiencia del Cuidador' },
          optionSetSlug: 'experience_levels', tab: 'Handler Info', order: 5 
        }),

        // Professional Experience
        createField('modeling_experience', 'option_set', { 
          label: { 'en-US': 'Modeling Experience Level', 'es-ES': 'Nivel de Experiencia en Modelaje' },
          optionSetSlug: 'experience_levels', tab: 'Professional', order: 1 
        }),
        createField('previous_work', 'text', { 
          label: { 'en-US': 'Previous Modeling/Acting Work', 'es-ES': 'Trabajo Previo de Modelaje/Actuación' },
          tab: 'Professional', order: 2 
        }),
        createField('comfortable_environments', 'option_set', { 
          label: { 'en-US': 'Comfortable Working Environments', 'es-ES': 'Ambientes de Trabajo Cómodos' },
          optionSetSlug: 'work_environments', allowMultiple: true, tab: 'Professional', order: 3 
        }),
        createField('specializes_in', 'option_set', { 
          label: { 'en-US': 'Specializes In', 'es-ES': 'Se Especializa En' },
          optionSetSlug: 'pet_specializations', allowMultiple: true, tab: 'Professional', order: 4 
        }),

        // Availability & Logistics
        createField('availability_type', 'option_set', { optionSetSlug: 'availability_types', tab: 'Availability', order: 1 }),
        createField('travel_willingness', 'option_set', { optionSetSlug: 'travel_willingness', tab: 'Availability', order: 2 }),
        createField('max_shoot_duration', 'option_set', { 
          label: { 'en-US': 'Maximum Shoot Duration', 'es-ES': 'Duración Máxima de Sesión' },
          optionSetSlug: 'pet_shoot_durations', tab: 'Availability', order: 3 
        }),
        createField('weather_limitations', 'option_set', { 
          label: { 'en-US': 'Weather/Temperature Limitations', 'es-ES': 'Limitaciones de Clima/Temperatura' },
          optionSetSlug: 'weather_limitations', allowMultiple: true, tab: 'Availability', order: 4 
        })
      ]
    }
  },

  // ===========================================
  // CREATIVE PROFESSIONAL SCHEMAS
  // ===========================================

  photographer: {
    type: 'profile',
    subType: 'photographer',
    displayName: {
      'en-US': 'Photographer',
      'es-ES': 'Fotógrafo',
      'fr-FR': 'Photographe',
      'de-DE': 'Fotograf'
    },
    description: {
      'en-US': 'Professional photographer profile for fashion, commercial, portrait, and creative photography',
      'es-ES': 'Perfil de fotógrafo profesional para fotografía de moda, comercial, retrato y creativa'
    },
    isActive: true,
    schema: {
      fields: [
        // Professional Identity
        createField('business_name', 'string', { 
          label: { 'en-US': 'Business/Studio Name', 'es-ES': 'Nombre del Negocio/Estudio' },
          tab: 'Professional', order: 1 
        }),
        createField('first_name', 'string', { required: true, tab: 'Professional', order: 2 }),
        createField('last_name', 'string', { required: true, tab: 'Professional', order: 3 }),
        createField('years_experience', 'option_set', { 
          optionSetSlug: 'experience_levels', required: true, tab: 'Professional', order: 4 
        }),
        createField('primary_location', 'string', { 
          label: { 'en-US': 'Primary Studio/Business Location', 'es-ES': 'Ubicación Principal del Estudio/Negocio' },
          required: true, tab: 'Professional', order: 5 
        }),

        // Photography Specializations
        createField('photography_styles', 'option_set', { 
          optionSetSlug: 'photography_styles', allowMultiple: true, required: true, tab: 'Specializations', order: 1 
        }),
        createField('preferred_subjects', 'option_set', { 
          label: { 'en-US': 'Preferred Subjects', 'es-ES': 'Sujetos Preferidos' },
          optionSetSlug: 'photography_subjects', allowMultiple: true, tab: 'Specializations', order: 2 
        }),
        createField('shoot_types', 'option_set', { 
          label: { 'en-US': 'Shoot Types Offered', 'es-ES': 'Tipos de Sesión Ofrecidos' },
          optionSetSlug: 'photography_shoot_types', allowMultiple: true, tab: 'Specializations', order: 3 
        }),
        createField('lighting_expertise', 'option_set', { 
          label: { 'en-US': 'Lighting Expertise', 'es-ES': 'Experiencia en Iluminación' },
          optionSetSlug: 'lighting_types', allowMultiple: true, tab: 'Specializations', order: 4 
        }),

        // Technical Equipment
        createField('camera_systems', 'option_set', { 
          label: { 'en-US': 'Camera Systems', 'es-ES': 'Sistemas de Cámara' },
          optionSetSlug: 'camera_systems', allowMultiple: true, tab: 'Equipment', order: 1 
        }),
        createField('lens_collection', 'option_set', { 
          label: { 'en-US': 'Lens Collection', 'es-ES': 'Colección de Lentes' },
          optionSetSlug: 'lens_types', allowMultiple: true, tab: 'Equipment', order: 2 
        }),
        createField('lighting_equipment', 'option_set', { 
          label: { 'en-US': 'Lighting Equipment', 'es-ES': 'Equipo de Iluminación' },
          optionSetSlug: 'lighting_equipment', allowMultiple: true, tab: 'Equipment', order: 3 
        }),
        createField('studio_space', 'boolean', { 
          label: { 'en-US': 'Has Dedicated Studio Space', 'es-ES': 'Tiene Espacio de Estudio Dedicado' },
          tab: 'Equipment', order: 4 
        }),
        createField('studio_size', 'option_set', { 
          label: { 'en-US': 'Studio Size', 'es-ES': 'Tamaño del Estudio' },
          optionSetSlug: 'studio_sizes', tab: 'Equipment', order: 5 
        }),
        createField('mobile_setup', 'boolean', { 
          label: { 'en-US': 'Mobile/Location Setup Available', 'es-ES': 'Configuración Móvil/de Ubicación Disponible' },
          tab: 'Equipment', order: 6 
        }),

        // Post-Production Capabilities
        createField('editing_software', 'option_set', { 
          label: { 'en-US': 'Editing Software Proficiency', 'es-ES': 'Competencia en Software de Edición' },
          optionSetSlug: 'photo_editing_software', allowMultiple: true, tab: 'Post-Production', order: 1 
        }),
        createField('retouching_level', 'option_set', { 
          label: { 'en-US': 'Retouching Expertise Level', 'es-ES': 'Nivel de Experiencia en Retoque' },
          optionSetSlug: 'retouching_levels', tab: 'Post-Production', order: 2 
        }),
        createField('color_grading', 'boolean', { 
          label: { 'en-US': 'Color Grading Services', 'es-ES': 'Servicios de Corrección de Color' },
          tab: 'Post-Production', order: 3 
        }),
        createField('delivery_formats', 'option_set', { 
          label: { 'en-US': 'Delivery Formats', 'es-ES': 'Formatos de Entrega' },
          optionSetSlug: 'image_formats', allowMultiple: true, tab: 'Post-Production', order: 4 
        }),
        createField('turnaround_time', 'option_set', { 
          optionSetSlug: 'turnaround_times', tab: 'Post-Production', order: 5 
        }),

        // Business & Professional
        createField('portfolio_url', 'url', { 
          label: { 'en-US': 'Portfolio Website', 'es-ES': 'Sitio Web de Portafolio' },
          tab: 'Professional', order: 6 
        }),
        createField('instagram_handle', 'string', { 
          label: { 'en-US': 'Instagram Handle', 'es-ES': 'Usuario de Instagram' },
          tab: 'Professional', order: 7 
        }),
        createField('business_license', 'boolean', { 
          label: { 'en-US': 'Business License/Registration', 'es-ES': 'Licencia/Registro de Negocio' },
          tab: 'Professional', order: 8 
        }),
        createField('insurance_coverage', 'option_set', { 
          label: { 'en-US': 'Insurance Coverage', 'es-ES': 'Cobertura de Seguro' },
          optionSetSlug: 'insurance_types', allowMultiple: true, tab: 'Professional', order: 9 
        }),

        // Collaboration & Working Style
        createField('team_collaboration', 'option_set', { 
          label: { 'en-US': 'Team Collaboration Preference', 'es-ES': 'Preferencia de Colaboración en Equipo' },
          optionSetSlug: 'collaboration_styles', tab: 'Working Style', order: 1 
        }),
        createField('makeup_artist_network', 'boolean', { 
          label: { 'en-US': 'Has Makeup Artist Network', 'es-ES': 'Tiene Red de Maquilladores' },
          tab: 'Working Style', order: 2 
        }),
        createField('stylist_network', 'boolean', { 
          label: { 'en-US': 'Has Stylist Network', 'es-ES': 'Tiene Red de Estilistas' },
          tab: 'Working Style', order: 3 
        }),
        createField('model_direction_style', 'option_set', { 
          label: { 'en-US': 'Model Direction Style', 'es-ES': 'Estilo de Dirección de Modelos' },
          optionSetSlug: 'direction_styles', tab: 'Working Style', order: 4 
        }),

        // Availability & Pricing
        createField('availability_type', 'option_set', { optionSetSlug: 'availability_types', tab: 'Availability', order: 1 }),
        createField('travel_willingness', 'option_set', { optionSetSlug: 'travel_willingness', tab: 'Availability', order: 2 }),
        createField('booking_notice', 'option_set', { 
          optionSetSlug: 'notice_requirements', tab: 'Availability', order: 3 
        }),
        createField('rate_structure', 'option_set', { 
          label: { 'en-US': 'Rate Structure', 'es-ES': 'Estructura de Tarifas' },
          optionSetSlug: 'photographer_rate_structures', tab: 'Availability', order: 4 
        }),
        createField('package_deals', 'boolean', { 
          label: { 'en-US': 'Offers Package Deals', 'es-ES': 'Ofrece Paquetes' },
          tab: 'Availability', order: 5 
        })
      ]
    }
  },

  makeup_artist: {
    type: 'profile',
    subType: 'makeup_artist',
    displayName: {
      'en-US': 'Makeup Artist',
      'es-ES': 'Maquillador',
      'fr-FR': 'Maquilleur',
      'de-DE': 'Makeup-Artist'
    },
    description: {
      'en-US': 'Professional makeup artist profile for fashion, film, bridal, and special effects makeup',
      'es-ES': 'Perfil de maquillador profesional para moda, cine, novias y efectos especiales'
    },
    isActive: true,
    schema: {
      fields: [
        // Professional Identity
        createField('business_name', 'string', { tab: 'Professional', order: 1 }),
        createField('first_name', 'string', { required: true, tab: 'Professional', order: 2 }),
        createField('last_name', 'string', { required: true, tab: 'Professional', order: 3 }),
        createField('years_experience', 'option_set', { optionSetSlug: 'experience_levels', required: true, tab: 'Professional', order: 4 }),

        // Makeup Specializations
        createField('makeup_specialties', 'option_set', { 
          optionSetSlug: 'makeup_specialties', allowMultiple: true, required: true, tab: 'Specializations', order: 1 
        }),
        createField('skin_tone_expertise', 'option_set', { 
          label: { 'en-US': 'Skin Tone Expertise', 'es-ES': 'Experiencia en Tonos de Piel' },
          optionSetSlug: 'skin_tones', allowMultiple: true, tab: 'Specializations', order: 2 
        }),
        createField('age_specialization', 'option_set', { 
          label: { 'en-US': 'Age Group Specialization', 'es-ES': 'Especialización por Grupo de Edad' },
          optionSetSlug: 'age_specializations', allowMultiple: true, tab: 'Specializations', order: 3 
        }),
        createField('gender_expertise', 'option_set', { 
          label: { 'en-US': 'Gender Expertise', 'es-ES': 'Experiencia por Género' },
          optionSetSlug: 'makeup_gender_expertise', allowMultiple: true, tab: 'Specializations', order: 4 
        }),

        // Technical Skills
        createField('makeup_techniques', 'option_set', { 
          label: { 'en-US': 'Makeup Techniques', 'es-ES': 'Técnicas de Maquillaje' },
          optionSetSlug: 'makeup_techniques', allowMultiple: true, tab: 'Skills', order: 1 
        }),
        createField('prosthetics_experience', 'option_set', { 
          label: { 'en-US': 'Prosthetics Experience Level', 'es-ES': 'Nivel de Experiencia en Prótesis' },
          optionSetSlug: 'prosthetics_levels', tab: 'Skills', order: 2 
        }),
        createField('body_painting', 'boolean', { 
          label: { 'en-US': 'Body Painting Services', 'es-ES': 'Servicios de Pintura Corporal' },
          tab: 'Skills', order: 3 
        }),
        createField('hair_styling', 'option_set', { 
          label: { 'en-US': 'Hair Styling Capabilities', 'es-ES': 'Capacidades de Peinado' },
          optionSetSlug: 'hair_styling_levels', tab: 'Skills', order: 4 
        }),
        createField('wig_styling', 'boolean', { 
          label: { 'en-US': 'Wig Styling/Application', 'es-ES': 'Peinado/Aplicación de Pelucas' },
          tab: 'Skills', order: 5 
        }),

        // Professional Equipment & Products
        createField('kit_completeness', 'option_set', { 
          label: { 'en-US': 'Makeup Kit Completeness', 'es-ES': 'Completitud del Kit de Maquillaje' },
          optionSetSlug: 'kit_completeness_levels', tab: 'Equipment', order: 1 
        }),
        createField('brand_preferences', 'option_set', { 
          label: { 'en-US': 'Preferred Makeup Brands', 'es-ES': 'Marcas de Maquillaje Preferidas' },
          optionSetSlug: 'makeup_brands', allowMultiple: true, tab: 'Equipment', order: 2 
        }),
        createField('airbrush_equipment', 'boolean', { 
          label: { 'en-US': 'Airbrush Equipment', 'es-ES': 'Equipo de Aerógrafo' },
          tab: 'Equipment', order: 3 
        }),
        createField('sanitation_protocols', 'option_set', { 
          label: { 'en-US': 'Sanitation Protocols', 'es-ES': 'Protocolos de Sanitización' },
          optionSetSlug: 'sanitation_levels', tab: 'Equipment', order: 4 
        }),
        createField('lighting_knowledge', 'option_set', { 
          label: { 'en-US': 'Lighting Knowledge for Makeup', 'es-ES': 'Conocimiento de Iluminación para Maquillaje' },
          optionSetSlug: 'lighting_knowledge_levels', tab: 'Equipment', order: 5 
        }),

        // Certifications & Training
        createField('formal_training', 'option_set', { 
          label: { 'en-US': 'Formal Training/Education', 'es-ES': 'Entrenamiento/Educación Formal' },
          optionSetSlug: 'makeup_education_types', allowMultiple: true, tab: 'Education', order: 1 
        }),
        createField('certifications', 'option_set', { 
          label: { 'en-US': 'Professional Certifications', 'es-ES': 'Certificaciones Profesionales' },
          optionSetSlug: 'makeup_certifications', allowMultiple: true, tab: 'Education', order: 2 
        }),
        createField('continued_education', 'boolean', { 
          label: { 'en-US': 'Actively Pursuing Continued Education', 'es-ES': 'Persiguiendo Activamente Educación Continua' },
          tab: 'Education', order: 3 
        }),

        // Professional Experience & Portfolio
        createField('portfolio_url', 'url', { tab: 'Professional', order: 5 }),
        createField('notable_clients', 'text', { 
          label: { 'en-US': 'Notable Clients/Publications', 'es-ES': 'Clientes/Publicaciones Notables' },
          tab: 'Professional', order: 6 
        }),
        createField('fashion_week_experience', 'boolean', { 
          label: { 'en-US': 'Fashion Week Experience', 'es-ES': 'Experiencia en Semana de la Moda' },
          tab: 'Professional', order: 7 
        }),
        createField('film_tv_credits', 'text', { 
          label: { 'en-US': 'Film/TV Credits', 'es-ES': 'Créditos de Cine/TV' },
          tab: 'Professional', order: 8 
        }),

        // Working Style & Collaboration
        createField('working_style', 'option_set', { 
          label: { 'en-US': 'Working Style', 'es-ES': 'Estilo de Trabajo' },
          optionSetSlug: 'makeup_working_styles', tab: 'Working Style', order: 1 
        }),
        createField('client_consultation', 'option_set', { 
          label: { 'en-US': 'Client Consultation Approach', 'es-ES': 'Enfoque de Consulta al Cliente' },
          optionSetSlug: 'consultation_styles', tab: 'Working Style', order: 2 
        }),
        createField('team_player', 'boolean', { 
          label: { 'en-US': 'Comfortable Working in Teams', 'es-ES': 'Cómodo Trabajando en Equipos' },
          tab: 'Working Style', order: 3 
        }),
        createField('time_management', 'option_set', { 
          label: { 'en-US': 'Time Management Style', 'es-ES': 'Estilo de Gestión del Tiempo' },
          optionSetSlug: 'time_management_styles', tab: 'Working Style', order: 4 
        }),

        // Availability & Business
        createField('availability_type', 'option_set', { optionSetSlug: 'availability_types', tab: 'Availability', order: 1 }),
        createField('travel_willingness', 'option_set', { optionSetSlug: 'travel_willingness', tab: 'Availability', order: 2 }),
        createField('early_call_times', 'boolean', { 
          label: { 'en-US': 'Available for Early Call Times', 'es-ES': 'Disponible para Llamadas Tempranas' },
          tab: 'Availability', order: 3 
        }),
        createField('rate_structure', 'option_set', { 
          optionSetSlug: 'makeup_rate_structures', tab: 'Availability', order: 4 
        }),
        createField('trial_sessions', 'boolean', { 
          label: { 'en-US': 'Offers Trial/Test Sessions', 'es-ES': 'Ofrece Sesiones de Prueba' },
          tab: 'Availability', order: 5 
        })
      ]
    }
  }
};

/**
 * Creates a model schema in the database
 */
async function createModelSchema(data: {
  type: string;
  subType: string;
  displayName: Record<string, string>;
  description?: Record<string, string>;
  isActive: boolean;
  schema: {
    fields: Array<{
      name: string;
      type: string;
      label?: Record<string, string>;
      required?: boolean;
      optionSetSlug?: string;
      allowMultiple?: boolean;
      tab?: string;
      group?: string;
      order?: number;
      unit?: string;
      placeholder?: Record<string, string>;
      helpText?: Record<string, string>;
      visibleToRoles?: string[];
      editableByRoles?: string[];
      validation?: Record<string, any>;
    }>;
  };
}) {
  try {
    logger.info(`Creating model schema: ${data.type}:${data.subType}`);
    
    // Replace option set slugs with actual IDs
    const processedFields = await Promise.all(
      data.schema.fields.map(async (field) => {
        if (field.optionSetSlug) {
          try {
            const optionSetId = await getOptionSetId(field.optionSetSlug);
            return {
              ...field,
              optionSetId,
              optionSetSlug: undefined // Remove slug after conversion
            };
          } catch (error) {
            logger.warn(`Option set not found: ${field.optionSetSlug}, skipping field ${field.name}`);
            return null; // Skip this field if option set not found
          }
        }
        return field;
      })
    );

    // Filter out null fields (where option sets weren't found)
    const validFields = processedFields.filter(field => field !== null);

    // Create the model schema
    const modelSchema = await prisma.modelSchema.create({
      data: {
        type: data.type,
        subType: data.subType,
        displayName: data.displayName,
        description: data.description || {},
        isActive: data.isActive,
        tenantId: null, // Global schemas
        schema: {
          fields: validFields
        }
      }
    });

    logger.info(`Created model schema ${data.type}:${data.subType} with ${validFields.length} fields`);
    return modelSchema;
  } catch (error) {
    logger.error(`Error creating model schema ${data.type}:${data.subType}:`, error);
    throw error;
  }
}

/**
 * Main seeder function
 */
export async function seedComprehensiveModelSchemas() {
  try {
    logger.info('Starting comprehensive model schemas seeding...');

    const results = [];
    
    for (const [key, schemaData] of Object.entries(COMPREHENSIVE_MODEL_SCHEMAS)) {
      try {
        const result = await createModelSchema(schemaData);
        results.push(result);
        
        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        logger.error(`Failed to create model schema ${key}:`, error);
        // Continue with other schemas even if one fails
      }
    }

    logger.info(`Comprehensive model schemas seeding completed. Created ${results.length} schemas.`);
    
    // Summary of what was created
    const summary = {
      totalSchemas: results.length,
      totalFields: results.reduce((sum, result) => {
        const fields = (result.schema as any)?.fields || [];
        return sum + fields.length;
      }, 0),
      categories: {
        humanModels: results.filter(r => r.subType.includes('model') && !r.subType.includes('pet')).length,
        voiceTalent: results.filter(r => r.subType.includes('voice')).length,
        petModels: results.filter(r => r.subType.includes('pet')).length,
        creativeRoles: results.filter(r => r.subType.includes('photographer') || r.subType.includes('makeup')).length
      },
      bySubType: results.reduce((acc, result) => {
        acc[result.subType] = (acc[result.subType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    logger.info('Model schemas summary:', summary);
    return summary;

  } catch (error) {
    logger.error('Error during comprehensive model schemas seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Export for use in main seeder
export default seedComprehensiveModelSchemas;