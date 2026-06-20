import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
  return `${amount.toFixed(2)}€`;
};

const formatNumber = (num: number, padding = 2): string => {
  return String(num).padStart(padding, '0');
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#232323',
  },

  header: {
    backgroundColor: '#fb5a2e',
    padding: 30,
    paddingTop: 40,
    paddingBottom: 35,
  },
  headerPurpleBar: {
    backgroundColor: '#d7bdff',
    height: 8,
    marginTop: 15,
    borderRadius: 4,
  },
  companyName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 36,
    color: '#ffffff',
    marginBottom: 10,
  },
  facturaTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 28,
    color: '#ffffff',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#ffffff',
    marginBottom: 2,
  },

  infoSection: {
    flexDirection: 'row',
    padding: 30,
    paddingBottom: 10,
    gap: 20,
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: '#fb5a2e',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fb5a2e',
    borderBottomStyle: 'solid',
    paddingBottom: 4,
  },
  infoText: {
    fontSize: 10,
    color: '#4c4c4c',
    lineHeight: 1.6,
  },
  infoTextBold: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#232323',
  },

  tableSection: {
    paddingHorizontal: 30,
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fb5a2e',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#ffffff',
  },
  tableHeaderCol1: {
    width: 40,
  },
  tableHeaderCol2: {
    flex: 1,
  },
  tableHeaderCol3: {
    width: 90,
    textAlign: 'right',
  },

  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
    borderBottomStyle: 'solid',
  },
  tableRowEven: {
    backgroundColor: '#fafafa',
  },
  tableRowText: {
    fontSize: 10,
    color: '#232323',
  },
  tableRowCol1: {
    width: 40,
  },
  tableRowCol2: {
    flex: 1,
  },
  tableRowCol3: {
    width: 90,
    textAlign: 'right',
  },
  serviceName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#232323',
  },
  serviceDescription: {
    fontSize: 9,
    color: '#4c4c4c',
    marginTop: 2,
  },

  totalsSection: {
    paddingHorizontal: 30,
    marginTop: 15,
    alignItems: 'flex-end',
  },
  totalsContainer: {
    width: 200,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 10,
    color: '#4c4c4c',
  },
  totalValue: {
    fontSize: 10,
    color: '#232323',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: '#fb5a2e',
    borderTopStyle: 'solid',
  },
  grandTotalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: '#fb5a2e',
  },
  grandTotalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    color: '#fb5a2e',
  },

  notesSection: {
    paddingHorizontal: 30,
    marginTop: 15,
  },
  notesText: {
    fontSize: 9,
    color: '#4c4c4c',
    fontStyle: 'italic',
  },

  footer: {
    marginTop: 40,
    backgroundColor: '#232323',
    padding: 25,
    paddingHorizontal: 30,
  },
  footerQuestionText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  footerContactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
  },
  footerContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  footerContactLabel: {
    fontSize: 9,
    color: '#d7bdff',
  },
  footerContactValue: {
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
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{configuracion.nombre_empresa}</Text>
          <Text style={styles.facturaTitle}>Factura</Text>
          <Text style={styles.invoiceNumber}>N°: {factura.numero}</Text>
          <Text style={styles.dateText}>
            Fecha de emisión: {factura.fecha_emision}
          </Text>
          {factura.fecha_vencimiento && (
            <Text style={styles.dateText}>
              Fecha de vencimiento: {factura.fecha_vencimiento}
            </Text>
          )}
          <View style={styles.headerPurpleBar} />
        </View>

        {/* Sender / Client Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoLabel}>De</Text>
            <Text style={styles.infoTextBold}>{configuracion.nombre_empresa}</Text>
            <Text style={styles.infoText}>{configuracion.direccion_empresa}</Text>
            <Text style={styles.infoText}>{configuracion.correo_empresa}</Text>
            <Text style={styles.infoText}>{configuracion.telefono_empresa}</Text>
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
                  <Text style={styles.infoText}>{cliente.direccion}</Text>
                )}
                {cliente.cif && (
                  <Text style={styles.infoText}>CIF: {cliente.cif}</Text>
                )}
                {cliente.correo && (
                  <Text style={styles.infoText}>{cliente.correo}</Text>
                )}
              </>
            ) : (
              <Text style={styles.infoText}>Sin cliente asignado</Text>
            )}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.tableSection}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.tableHeaderCol1]}>N°</Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderCol2]}>
              Servicio
            </Text>
            <Text style={[styles.tableHeaderText, styles.tableHeaderCol3]}>Costo</Text>
          </View>

          {items.map((item, index) => (
            <View
              key={index}
              style={[
                styles.tableRow,
                index % 2 === 0 ? {} : styles.tableRowEven,
              ]}
            >
              <Text style={[styles.tableRowText, styles.tableRowCol1]}>
                {formatNumber(index + 1)}
              </Text>
              <View style={styles.tableRowCol2}>
                <Text style={styles.serviceName}>
                  {item.servicio?.nombre || 'Servicio'}
                </Text>
                {item.descripcion && (
                  <Text style={styles.serviceDescription}>{item.descripcion}</Text>
                )}
              </View>
              <Text style={[styles.tableRowText, styles.tableRowCol3]}>
                {formatCurrency(item.subtotal)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(factura.subtotal)}
              </Text>
            </View>
            {factura.iva_monto > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>
                  IVA ({factura.iva_porcentaje}%)
                </Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(factura.iva_monto)}
                </Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(factura.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {factura.notas && (
          <View style={styles.notesSection}>
            <Text style={styles.notesText}>Nota: {factura.notas}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerQuestionText}>
            ¿Tienes alguna duda? ¡Contáctanos!
          </Text>
          <View style={styles.footerContactRow}>
            <View style={styles.footerContactItem}>
              <Text style={styles.footerContactLabel}>WhatsApp:</Text>
              <Text style={styles.footerContactValue}>
                {configuracion.telefono_empresa}
              </Text>
            </View>
            <View style={styles.footerContactItem}>
              <Text style={styles.footerContactLabel}>Correo:</Text>
              <Text style={styles.footerContactValue}>
                {configuracion.correo_empresa}
              </Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
