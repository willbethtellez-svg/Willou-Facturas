import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Space Grotesk',
  fonts: [
    { src: '/assets/fonts/SpaceGrotesk-Regular.ttf', fontWeight: 400 },
    { src: '/assets/fonts/SpaceGrotesk-Medium.ttf', fontWeight: 500 },
    { src: '/assets/fonts/SpaceGrotesk-Bold.ttf', fontWeight: 600 },
    { src: '/assets/fonts/SpaceGrotesk-Bold.ttf', fontWeight: 700 },
  ],
});

interface FacturaPDFProps {
  factura: {
    numero: string;
    fecha_emision: string;
    fecha_vencimiento: string | null;
    subtotal: number;
    iva_porcentaje: number;
    iva_monto: number;
    total: number;
    notas: string | null;
  };
  cliente: {
    nombre: string;
    empresa: string | null;
    direccion: string | null;
    cif: string | null;
    correo: string | null;
  } | null;
  items: Array<{
    descripcion: string | null;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    servicio?: { nombre: string } | null;
  }>;
  configuracion: {
    nombre_empresa: string;
    direccion_empresa: string;
    telefono_empresa: string;
    correo_empresa: string;
  };
}

const formatCurrency = (amount: number): string => {
  return `${amount.toFixed(2)}`;
};

const formatNumber = (num: number): string => {
  return String(num).padStart(2, '0');
};

const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  return `${date.getDate()} de ${months[date.getMonth()]}, ${date.getFullYear()}`;
};

// Layout constants
const PAGE_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const HEADER_HEIGHT = 260;
const CONTENT_TOP_PADDING = 20;
const TABLE_HEADER_HEIGHT = 40;
const TABLE_HEADER_MARGIN = 12;
const ITEM_ROW_HEIGHT = 50;
const ITEM_ROW_MARGIN = 8;
const TOTALS_HEIGHT = 75;
const FOOTER_HEIGHT = 90;
const SIDE_PADDING = 30;

const BASE_HEIGHT = HEADER_HEIGHT + CONTENT_TOP_PADDING + TABLE_HEADER_HEIGHT + TABLE_HEADER_MARGIN + TOTALS_HEIGHT + FOOTER_HEIGHT;
const ITEM_HEIGHT = ITEM_ROW_HEIGHT + ITEM_ROW_MARGIN;

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    backgroundColor: '#0f0f0f',
    padding: 0,
  },

  headerContainer: {
    width: '100%',
    height: HEADER_HEIGHT,
    position: 'relative',
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    padding: 30,
    paddingBottom: 15,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  facturaTitle: {
    fontFamily: 'Space Grotesk',
    fontSize: 42,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: -1,
  },
  logoImage: {
    width: 110,
    height: 40,
    objectFit: 'contain',
  },
  invoiceNumber: {
    fontFamily: 'Space Grotesk',
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 3,
  },
  dateText: {
    fontFamily: 'Space Grotesk',
    fontSize: 9,
    color: '#ffffff',
    marginBottom: 1,
  },
  dateLabel: {
    fontWeight: '600',
  },

  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  infoColumn: {
    width: '48%',
  },
  infoLabel: {
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  infoText: {
    fontFamily: 'Space Grotesk',
    fontSize: 8,
    color: '#ffffff',
    lineHeight: 1.4,
    opacity: 0.9,
  },
  infoTextBold: {
    fontFamily: 'Space Grotesk',
    fontSize: 8,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 1,
  },

  contentSection: {
    paddingHorizontal: SIDE_PADDING,
    paddingTop: CONTENT_TOP_PADDING,
    paddingBottom: 10,
  },

  tableHeader: {
    backgroundColor: '#fb5a2e',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: TABLE_HEADER_MARGIN,
  },
  tableHeaderText: {
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  tableHeaderCol1: { width: 40 },
  tableHeaderCol2: { flex: 1 },
  tableHeaderCol3: { width: 90, textAlign: 'right' },

  tableRow: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ITEM_ROW_MARGIN,
    height: ITEM_ROW_HEIGHT,
  },
  tableRowDark: { backgroundColor: '#232323' },
  tableRowCol1: { width: 40 },
  tableRowCol2: { flex: 1 },
  tableRowCol3: { width: 90, textAlign: 'right' },
  serviceName: {
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  productValue: {
    fontFamily: 'Space Grotesk',
    fontSize: 8,
    color: '#888888',
    marginTop: 1,
  },
  costText: {
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    fontWeight: '500',
    color: '#ffffff',
  },

  totalsSection: {
    marginTop: 5,
    alignItems: 'flex-end',
    paddingHorizontal: SIDE_PADDING,
  },
  totalBreakdown: {
    marginBottom: 6,
    width: 180,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  totalLabel: {
    fontFamily: 'Space Grotesk',
    fontSize: 8,
    color: '#888888',
  },
  totalValue: {
    fontFamily: 'Space Grotesk',
    fontSize: 8,
    color: '#ffffff',
  },
  totalBox: {
    borderWidth: 1.5,
    borderColor: '#fb5a2e',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  totalText: {
    fontFamily: 'Space Grotesk',
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },

  footer: {
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 15,
    paddingBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLeft: {
    flex: 1,
  },
  footerQuestion: {
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  footerContactRow: {
    flexDirection: 'row',
    gap: 16,
  },
  footerContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  footerIconInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  footerContactInfo: {
    flexDirection: 'column',
  },
  footerContactLabel: {
    fontFamily: 'Space Grotesk',
    fontSize: 7,
    color: '#888888',
  },
  footerContactValue: {
    fontFamily: 'Space Grotesk',
    fontSize: 8,
    color: '#ffffff',
  },
});

export default function FacturaPDF({
  factura,
  cliente,
  items,
  configuracion,
}: FacturaPDFProps) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const iva = factura.iva_monto;
  const total = factura.total;

  const contentHeight = HEADER_HEIGHT + CONTENT_TOP_PADDING + TABLE_HEADER_HEIGHT + TABLE_HEADER_MARGIN + items.length * ITEM_HEIGHT;
  const bottomHeight = TOTALS_HEIGHT + FOOTER_HEIGHT;
  const naturalTotal = contentHeight + bottomHeight;
  const spacerHeight = Math.max(0, A4_HEIGHT - naturalTotal);
  const pageHeight = Math.max(A4_HEIGHT, naturalTotal);

  return (
    <Document>
      <Page size={[PAGE_WIDTH, pageHeight]} style={styles.page}>
        <View style={styles.headerContainer}>
          <Image src="/assets/pdf/header-bg.png" style={styles.headerBg} />
          <View style={styles.headerOverlay}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <Text style={styles.facturaTitle}>Factura</Text>
                <Text style={styles.invoiceNumber}>N°: {factura.numero}</Text>
                <Text style={styles.dateText}>
                  <Text style={styles.dateLabel}>Fecha:</Text> {formatDateShort(factura.fecha_emision)}
                </Text>
                {factura.fecha_vencimiento && (
                  <Text style={styles.dateText}>
                    <Text style={styles.dateLabel}>Vencimiento:</Text> {formatDateShort(factura.fecha_vencimiento)}
                  </Text>
                )}
              </View>
              <Image src="/assets/pdf/logo-willou.png" style={styles.logoImage} />
            </View>
            <View style={styles.infoSection}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>De</Text>
                <Text style={styles.infoTextBold}>{configuracion.nombre_empresa}</Text>
                {configuracion.direccion_empresa && (
                  <Text style={styles.infoText}>Dirección: {configuracion.direccion_empresa}</Text>
                )}
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Cliente</Text>
                {cliente ? (
                  <>
                    <Text style={styles.infoTextBold}>
                      {cliente.empresa || cliente.nombre}
                    </Text>
                    {cliente.empresa && (
                      <Text style={styles.infoText}>{cliente.nombre}</Text>
                    )}
                    {cliente.direccion && (
                      <Text style={styles.infoText}>Dirección: {cliente.direccion}</Text>
                    )}
                    {cliente.cif && (
                      <Text style={styles.infoText}>CIF: {cliente.cif}</Text>
                    )}
                    {cliente.correo && (
                      <Text style={styles.infoText}>Correo: {cliente.correo}</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.infoText}>Sin cliente asignado</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.contentSection}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.tableHeaderCol1]}>N°</Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderCol2]}>Servicio</Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderCol3]}>Costo</Text>
          </View>

          {items.map((item, index) => (
            <View
              key={index}
              style={[styles.tableRow, styles.tableRowDark]}
            >
              <Text style={[styles.serviceName, styles.tableRowCol1]}>
                {formatNumber(index + 1)}
              </Text>
              <View style={styles.tableRowCol2}>
                <Text style={styles.serviceName}>
                  {item.servicio?.nombre || 'Servicio'}
                </Text>
                {item.descripcion && (
                  <Text style={styles.productValue}>{item.descripcion}</Text>
                )}
              </View>
              <Text style={[styles.costText, styles.tableRowCol3]}>
                ${formatCurrency(item.subtotal)}
              </Text>
            </View>
          ))}
        </View>

        {spacerHeight > 0 && (
          <View style={{ height: spacerHeight }} />
        )}

        <View style={styles.totalsSection}>
          <View style={styles.totalBreakdown}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${formatCurrency(subtotal)}</Text>
            </View>
            {iva > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>IVA ({factura.iva_porcentaje}%)</Text>
                <Text style={styles.totalValue}>${formatCurrency(iva)}</Text>
              </View>
            )}
          </View>
          <View style={styles.totalBox}>
            <Text style={styles.totalText}>Total: ${formatCurrency(total)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerQuestion}>¿Tienes alguna duda? Contáctanos!</Text>
            <View style={styles.footerContactRow}>
              <View style={styles.footerContactItem}>
                <View style={styles.footerIcon}>
                  <Image src="/assets/pdf/whatsapp-icon.png" style={styles.footerIconInner} />
                </View>
                <View style={styles.footerContactInfo}>
                  <Text style={styles.footerContactLabel}>Whatsapp</Text>
                  <Text style={styles.footerContactValue}>{configuracion.telefono_empresa}</Text>
                </View>
              </View>
              <View style={styles.footerContactItem}>
                <View style={styles.footerIcon}>
                  <Image src="/assets/pdf/email-icon.png" style={styles.footerIconInner} />
                </View>
                <View style={styles.footerContactInfo}>
                  <Text style={styles.footerContactLabel}>Correo</Text>
                  <Text style={styles.footerContactValue}>{configuracion.correo_empresa}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
