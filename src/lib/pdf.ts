/**
 * Comprobacion del CONTENIDO de un PDF subido por un desconocido (CV). Nombre y tipo MIME los
 * controla el cliente y no valen como prueba; aqui se mira el archivo.
 *
 * No es un antivirus: un PDF con contenido activo escondido en flujos comprimidos (`/ObjStm`) no
 * se ve desde aqui. Es un filtro de bajo coste que descarta lo que no es un PDF y los PDF con
 * contenido activo declarado, que es lo que usan casi todos los PDF maliciosos conocidos.
 */

/** Un PDF real pesa mas que esto. */
const MIN_BYTES = 200;

/**
 * Nombres PDF que ejecutan algo o incrustan otros archivos. Se buscan tambien con los escapes
 * hexadecimales que permite PDF en los nombres (`/J#61vaScript`), decodificados antes de mirar.
 * `/Encrypt` se rechaza porque un PDF cifrado no se puede inspeccionar.
 */
const ACTIVO =
  /\/(JavaScript|JS|Launch|EmbeddedFile|EmbeddedFiles|RichMedia|XFA|SubmitForm|ImportData|GoToE|GoToR|Encrypt)(?![A-Za-z0-9])/;

export type Veredicto = 'ok' | 'not_pdf' | 'active_content';

export function examinarPdf(bytes: Uint8Array): Veredicto {
  if (bytes.byteLength < MIN_BYTES) return 'not_pdf';
  // %PDF-  (0x25 0x50 0x44 0x46 0x2D) al principio del archivo, sin nada delante.
  const magia = [0x25, 0x50, 0x44, 0x46, 0x2d];
  if (!magia.every((b, i) => bytes[i] === b)) return 'not_pdf';

  const latin1 = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('latin1');
  // Un PDF completo termina con %%EOF (se tolera relleno en el ultimo KB).
  if (!latin1.slice(-1024).includes('%%EOF')) return 'not_pdf';

  const decodificado = latin1.replace(/#([0-9a-fA-F]{2})/g, (_, h: string) => String.fromCharCode(parseInt(h, 16)));
  return ACTIVO.test(decodificado) ? 'active_content' : 'ok';
}
