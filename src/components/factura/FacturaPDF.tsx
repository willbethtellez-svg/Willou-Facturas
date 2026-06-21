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

const MAX_VISIBLE_ROWS = 6;

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    backgroundColor: '#0f0f0f',
    padding: 0,
    width: 595.28,
    height: 841.89,
  },

  headerContainer: {
    width: '100%',
    height: 280,
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
    padding: 35,
    paddingBottom: 20,
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
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -1,
  },
  logoImage: {
    width: 120,
    height: 45,
    objectFit: 'contain',
  },
  invoiceNumber: {
    fontFamily: 'Space Grotesk',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  dateText: {
    fontFamily: 'Space Grotesk',
    fontSize: 10,
    color: '#ffffff',
    marginBottom: 2,
  },
  dateLabel: {
    fontWeight: '600',
  },

  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  infoColumn: {
    width: '48%',
  },
  infoLabel: {
    fontFamily: 'Space Grotesk',
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  infoText: {
    fontFamily: 'Space Grotesk',
    fontSize: 9,
    color: '#ffffff',
    lineHeight: 1.5,
    opacity: 0.9,
  },
  infoTextBold: {
    fontFamily: 'Space Grotesk',
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },

  contentSection: {
    paddingHorizontal: 35,
    paddingTop: 25,
    paddingBottom: 15,
  },

  tableHeader: {
    backgroundColor: '#fb5a2e',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tableHeaderText: {
    fontFamily: 'Space Grotesk',
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  tableHeaderCol1: { width: 45 },
  tableHeaderCol2: { flex: 1 },
  tableHeaderCol3: { width: 100, textAlign: 'right' },

  tableRow: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    minHeight: 52,
  },
  tableRowDark: { backgroundColor: '#232323' },
  tableRowEmpty: { backgroundColor: 'transparent' },
  tableRowCol1: { width: 45 },
  tableRowCol2: { flex: 1 },
  tableRowCol3: { width: 100, textAlign: 'right' },
  serviceName: {
    fontFamily: 'Space Grotesk',
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  productValue: {
    fontFamily: 'Space Grotesk',
    fontSize: 9,
    color: '#888888',
  },
  costText: {
    fontFamily: 'Space Grotesk',
    fontSize: 11,
    fontWeight: '500',
    color: '#ffffff',
  },

  totalsSection: {
    marginTop: 10,
    alignItems: 'flex-end',
    paddingHorizontal: 35,
  },
  totalBreakdown: {
    marginBottom: 8,
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: {
    fontFamily: 'Space Grotesk',
    fontSize: 9,
    color: '#888888',
  },
  totalValue: {
    fontFamily: 'Space Grotesk',
    fontSize: 9,
    color: '#ffffff',
  },
  totalBoxOuter: {
    borderWidth: 2,
    borderColor: '#fb5a2e',
    borderRadius: 20,
    paddingHorizontal: 1,
    paddingVertical: 1,
  },
  totalBoxInner: {
    borderWidth: 1,
    borderColor: '#d7bdff',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  totalText: {
    fontFamily: 'Space Grotesk',
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },

  footer: {
    backgroundColor: '#0f0f0f',
    paddingHorizontal: 35,
    paddingTop: 20,
    paddingBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerLeft: {
    flex: 1,
  },
  footerQuestion: {
    fontFamily: 'Space Grotesk',
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 10,
  },
  footerContactRow: {
    flexDirection: 'row',
    gap: 20,
  },
  footerContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fb5a2e',
  },
  footerIconInner: {
    width: 20,
    height: 20,
  },
  footerContactInfo: {
    flexDirection: 'column',
  },
  footerContactLabel: {
    fontFamily: 'Space Grotesk',
    fontSize: 8,
    color: '#888888',
  },
  footerContactValue: {
    fontFamily: 'Space Grotesk',
    fontSize: 9,
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

  const visibleItems = items.slice(0, MAX_VISIBLE_ROWS);
  const emptySlotCount = MAX_VISIBLE_ROWS - visibleItems.length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
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

          {visibleItems.map((item, index) => (
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

          {Array.from({ length: emptySlotCount }).map((_, index) => (
            <View
              key={`empty-${index}`}
              style={[styles.tableRow, styles.tableRowEmpty]}
            />
          ))}
        </View>

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
          <View style={styles.totalBoxOuter}>
            <View style={styles.totalBoxInner}>
              <Text style={styles.totalText}>Total: ${formatCurrency(total)}</Text>
            </View>
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
