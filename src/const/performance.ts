// Configuración centralizada para optimizaciones de performance

export const PERFORMANCE_CONFIG = {
	// Cache durations
	CACHE: {
		LOCATION: 5 * 60 * 1000, // 5 minutos
		HOLIDAYS: 10 * 60 * 1000, // 10 minutos
		PREMIUM_VALIDATION: 30 * 1000, // 30 segundos
	},

	// Debounce delays
	DEBOUNCE: {
		PREMIUM_VERIFICATION: 1000, // 1 segundo
		USER_INTERACTIONS: 300, // 300ms
	},

	// Lazy loading
	LAZY_LOADING: {
		THRESHOLD: 0.1, // Intersection Observer threshold
		ROOT_MARGIN: "50px", // Intersection Observer root margin
	},

	// Bundle splitting
	BUNDLE_SPLITTING: {
		CHUNK_SIZE: 244 * 1024, // 244KB
		MAX_CHUNKS: 5,
	},

	// Image optimization
	IMAGES: {
		QUALITY: 75,
		FORMATS: ["webp", "avif"],
		SIZES: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
	},
} as const;

// Configuración para diferentes entornos
export const ENV_PERFORMANCE_CONFIG = {
	development: {
		ENABLE_CACHE: false,
		ENABLE_COMPRESSION: false,
		ENABLE_MINIFICATION: false,
		LOG_PERFORMANCE: true,
	},
	production: {
		ENABLE_CACHE: true,
		ENABLE_COMPRESSION: true,
		ENABLE_MINIFICATION: true,
		LOG_PERFORMANCE: false,
	},
} as const;

// Métricas de performance objetivo
export const PERFORMANCE_TARGETS = {
	LCP: 2500, // Largest Contentful Paint (ms)
	FID: 100, // First Input Delay (ms)
	CLS: 0.1, // Cumulative Layout Shift
	TTFB: 800, // Time to First Byte (ms)
	FCP: 1800, // First Contentful Paint (ms)
} as const;
