// JSON Schemas for GoModels Form Configuration

export const profileFormSchema = {
  type: "object",
  title: "Profile Form Configuration",
  properties: {
    title: {
      type: "string",
      title: "Form Title",
      default: "Model Profile"
    },
    description: {
      type: "string",
      title: "Form Description"
    },
    sections: {
      type: "array",
      title: "Form Sections",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            title: "Section ID"
          },
          title: {
            type: "string",
            title: "Section Title"
          },
          description: {
            type: "string",
            title: "Section Description"
          },
          fields: {
            type: "array",
            title: "Fields",
            items: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  title: "Field ID"
                },
                type: {
                  type: "string",
                  title: "Field Type",
                  enum: ["text", "email", "number", "select", "multiselect", "textarea", "date", "file", "checkbox", "radio"]
                },
                label: {
                  type: "string",
                  title: "Field Label"
                },
                placeholder: {
                  type: "string",
                  title: "Placeholder"
                },
                required: {
                  type: "boolean",
                  title: "Required",
                  default: false
                },
                validation: {
                  type: "object",
                  title: "Validation Rules",
                  properties: {
                    minLength: {
                      type: "number",
                      title: "Minimum Length"
                    },
                    maxLength: {
                      type: "number",
                      title: "Maximum Length"
                    },
                    pattern: {
                      type: "string",
                      title: "Regex Pattern"
                    }
                  }
                },
                options: {
                  type: "array",
                  title: "Options (for select/radio)",
                  items: {
                    type: "object",
                    properties: {
                      value: {
                        type: "string",
                        title: "Value"
                      },
                      label: {
                        type: "string",
                        title: "Label"
                      }
                    }
                  }
                }
              },
              required: ["id", "type", "label"]
            }
          }
        },
        required: ["id", "title", "fields"]
      }
    },
    layout: {
      type: "object",
      title: "Layout Configuration",
      properties: {
        columns: {
          type: "number",
          title: "Number of Columns",
          minimum: 1,
          maximum: 4,
          default: 1
        },
        spacing: {
          type: "string",
          title: "Field Spacing",
          enum: ["compact", "normal", "relaxed"],
          default: "normal"
        }
      }
    },
    styling: {
      type: "object",
      title: "Styling Options",
      properties: {
        theme: {
          type: "string",
          title: "Theme",
          enum: ["default", "modern", "minimal", "professional"],
          default: "default"
        },
        primaryColor: {
          type: "string",
          title: "Primary Color",
          format: "color"
        }
      }
    }
  },
  required: ["title", "sections"]
};

export const searchFormSchema = {
  type: "object",
  title: "Search Form Configuration",
  properties: {
    title: {
      type: "string",
      title: "Search Form Title",
      default: "Find Models"
    },
    filters: {
      type: "array",
      title: "Search Filters",
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            title: "Filter ID"
          },
          label: {
            type: "string",
            title: "Filter Label"
          },
          type: {
            type: "string",
            title: "Filter Type",
            enum: ["text", "select", "multiselect", "range", "date-range", "location", "tags"]
          },
          field: {
            type: "string",
            title: "Database Field"
          },
          options: {
            type: "array",
            title: "Filter Options",
            items: {
              type: "object",
              properties: {
                value: { type: "string" },
                label: { type: "string" },
                count: { type: "number" }
              }
            }
          },
          defaultValue: {
            type: "string",
            title: "Default Value"
          },
          placeholder: {
            type: "string",
            title: "Placeholder Text"
          }
        },
        required: ["id", "label", "type", "field"]
      }
    },
    sorting: {
      type: "object",
      title: "Sorting Options",
      properties: {
        defaultSort: {
          type: "string",
          title: "Default Sort Field"
        },
        options: {
          type: "array",
          title: "Sort Options",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              label: { type: "string" },
              direction: { type: "string", enum: ["asc", "desc"] }
            }
          }
        }
      }
    },
    pagination: {
      type: "object",
      title: "Pagination Settings",
      properties: {
        pageSize: {
          type: "number",
          title: "Results Per Page",
          default: 20
        },
        showPageSize: {
          type: "boolean",
          title: "Show Page Size Selector",
          default: true
        }
      }
    }
  },
  required: ["title", "filters"]
};

export const applicationFormSchema = {
  type: "object",
  title: "Application Form Configuration",
  properties: {
    title: {
      type: "string",
      title: "Application Title",
      default: "Job Application"
    },
    jobDetails: {
      type: "object",
      title: "Job Details",
      properties: {
        title: { type: "string", title: "Job Title" },
        description: { type: "string", title: "Job Description" },
        requirements: {
          type: "array",
          title: "Requirements",
          items: { type: "string" }
        },
        compensation: {
          type: "object",
          title: "Compensation",
          properties: {
            type: { type: "string", enum: ["hourly", "daily", "project", "usage"] },
            amount: { type: "number" },
            currency: { type: "string", default: "EUR" }
          }
        }
      }
    },
    applicationFields: {
      type: "array",
      title: "Application Fields",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          type: { type: "string", enum: ["text", "textarea", "file", "portfolio", "availability", "experience"] },
          label: { type: "string" },
          required: { type: "boolean", default: false },
          helpText: { type: "string" }
        }
      }
    },
    workflow: {
      type: "object",
      title: "Application Workflow",
      properties: {
        autoApprove: {
          type: "boolean",
          title: "Auto-approve qualified applications",
          default: false
        },
        requirePortfolio: {
          type: "boolean",
          title: "Require portfolio submission",
          default: true
        },
        notificationEmails: {
          type: "array",
          title: "Notification Email Addresses",
          items: { type: "string", format: "email" }
        }
      }
    }
  },
  required: ["title", "jobDetails", "applicationFields"]
};

// UI Schemas for better form rendering
export const profileFormUISchema = {
  sections: {
    items: {
      fields: {
        items: {
          type: {
            "ui:widget": "select"
          },
          validation: {
            "ui:collapsible": true,
            "ui:collapsed": true
          },
          options: {
            "ui:collapsible": true,
            "ui:collapsed": true
          }
        }
      }
    }
  },
  styling: {
    primaryColor: {
      "ui:widget": "color"
    }
  }
};

export const searchFormUISchema = {
  filters: {
    items: {
      type: {
        "ui:widget": "select"
      },
      options: {
        "ui:collapsible": true,
        "ui:collapsed": true
      }
    }
  }
};

// Templates for common configurations
export const formTemplates = {
  "Basic Profile": {
    title: "Model Profile",
    description: "Basic model profile form",
    sections: [
      {
        id: "personal",
        title: "Personal Information",
        description: "Basic personal details",
        fields: [
          {
            id: "fullName",
            type: "text",
            label: "Full Name",
            required: true,
            validation: {
              minLength: 2,
              maxLength: 100
            }
          },
          {
            id: "email",
            type: "email",
            label: "Email Address",
            required: true
          },
          {
            id: "phone",
            type: "text",
            label: "Phone Number",
            validation: {
              pattern: "^[+]?[0-9\\s\\-\\(\\)]+$"
            }
          },
          {
            id: "dateOfBirth",
            type: "date",
            label: "Date of Birth",
            required: true
          }
        ]
      },
      {
        id: "physical",
        title: "Physical Attributes",
        fields: [
          {
            id: "height",
            type: "number",
            label: "Height (cm)",
            validation: {
              minimum: 140,
              maximum: 220
            }
          },
          {
            id: "eyeColor",
            type: "select",
            label: "Eye Color",
            options: [
              { value: "brown", label: "Brown" },
              { value: "blue", label: "Blue" },
              { value: "green", label: "Green" },
              { value: "hazel", label: "Hazel" },
              { value: "gray", label: "Gray" }
            ]
          },
          {
            id: "hairColor",
            type: "select",
            label: "Hair Color",
            options: [
              { value: "black", label: "Black" },
              { value: "brown", label: "Brown" },
              { value: "blonde", label: "Blonde" },
              { value: "red", label: "Red" },
              { value: "gray", label: "Gray" },
              { value: "other", label: "Other" }
            ]
          }
        ]
      }
    ],
    layout: {
      columns: 2,
      spacing: "normal"
    },
    styling: {
      theme: "modern",
      primaryColor: "#3b82f6"
    }
  },

  "Model Search": {
    title: "Find Models",
    filters: [
      {
        id: "location",
        label: "Location",
        type: "location",
        field: "location",
        placeholder: "Enter city or region"
      },
      {
        id: "category",
        label: "Category",
        type: "multiselect",
        field: "categories",
        options: [
          { value: "fashion", label: "Fashion", count: 150 },
          { value: "commercial", label: "Commercial", count: 89 },
          { value: "fitness", label: "Fitness", count: 67 },
          { value: "beauty", label: "Beauty", count: 134 }
        ]
      },
      {
        id: "experience",
        label: "Experience Level",
        type: "select",
        field: "experienceLevel",
        options: [
          { value: "beginner", label: "Beginner (0-1 years)" },
          { value: "intermediate", label: "Intermediate (2-5 years)" },
          { value: "experienced", label: "Experienced (5+ years)" }
        ]
      },
      {
        id: "ageRange",
        label: "Age Range",
        type: "range",
        field: "age",
        defaultValue: "18-65"
      }
    ],
    sorting: {
      defaultSort: "relevance",
      options: [
        { field: "relevance", label: "Relevance", direction: "desc" },
        { field: "rating", label: "Rating", direction: "desc" },
        { field: "experience", label: "Experience", direction: "desc" },
        { field: "location", label: "Location", direction: "asc" }
      ]
    },
    pagination: {
      pageSize: 24,
      showPageSize: true
    }
  },

  "Casting Application": {
    title: "Fashion Show Casting",
    jobDetails: {
      title: "Fashion Week Runway Model",
      description: "Seeking experienced runway models for upcoming fashion week shows",
      requirements: [
        "Minimum 5'8\" height",
        "Professional runway experience",
        "Available for full week",
        "Professional portfolio required"
      ],
      compensation: {
        type: "daily",
        amount: 500,
        currency: "EUR"
      }
    },
    applicationFields: [
      {
        id: "experience",
        type: "textarea",
        label: "Runway Experience",
        required: true,
        helpText: "Describe your runway modeling experience"
      },
      {
        id: "portfolio",
        type: "portfolio",
        label: "Portfolio",
        required: true,
        helpText: "Upload your best runway and fashion photos"
      },
      {
        id: "availability",
        type: "availability",
        label: "Availability",
        required: true,
        helpText: "Select your available dates"
      },
      {
        id: "measurements",
        type: "text",
        label: "Current Measurements",
        required: true,
        helpText: "Bust-Waist-Hips (e.g., 34-24-36)"
      }
    ],
    workflow: {
      autoApprove: false,
      requirePortfolio: true,
      notificationEmails: ["casting@agency.com", "director@fashionweek.com"]
    }
  }
}; 