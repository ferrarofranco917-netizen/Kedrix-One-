const KEDRIX_VAT_LOOKUP_CONFIG = {
  requireKey: false,
  accessKey: '',
  viesUrl: 'https://ec.europa.eu/taxation_customs/vies/services/checkVatService'
};

function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const country = String(params.country || 'IT').trim().toUpperCase();
  const vat = String(params.vat || '').trim().replace(/[^A-Z0-9]/gi, '');
  const entity = String(params.entity || '').trim();
  const key = String(params.key || '').trim();

  if (KEDRIX_VAT_LOOKUP_CONFIG.requireKey && key !== KEDRIX_VAT_LOOKUP_CONFIG.accessKey) {
    return jsonResponse({ ok: false, status: 'forbidden', message: 'Invalid access key.' });
  }
  if (!country || !vat) {
    return jsonResponse({ ok: false, status: 'invalid-vat', message: 'country and vat are required.' });
  }
  try {
    const vies = callVies_(country, vat);
    if (!vies.valid) {
      return jsonResponse({ ok: false, status: 'not-found', source: 'VIES via Apps Script', message: 'VAT number not valid in VIES.' });
    }
    const parsedAddress = parseAddress_(vies.address, country);
    return jsonResponse({
      ok: true,
      status: 'official-data',
      source: 'VIES via Apps Script',
      provider: 'apps-script-vies',
      entity: entity,
      data: {
        name: vies.name,
        shortName: vies.name,
        vatNumber: vat,
        taxCode: vat,
        address: parsedAddress.address,
        zipCode: parsedAddress.zipCode,
        city: parsedAddress.city,
        province: parsedAddress.province,
        country: country,
        notes: 'VIES validation via Apps Script',
        sourceLabel: 'VIES via Apps Script',
        lookupStatus: 'official-data',
        rawAddress: vies.address,
        requestDate: vies.requestDate
      }
    });
  } catch (error) {
    return jsonResponse({ ok: false, status: 'lookup-error', source: 'VIES via Apps Script', message: String(error && error.message || error) });
  }
}

function callVies_(country, vat) {
  const payload =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
    '<soap:Body>' +
    '<checkVat xmlns="urn:ec.europa.eu:taxud:vies:services:checkVat:types">' +
    '<countryCode>' + xmlEscape_(country) + '</countryCode>' +
    '<vatNumber>' + xmlEscape_(vat) + '</vatNumber>' +
    '</checkVat>' +
    '</soap:Body>' +
    '</soap:Envelope>';

  const response = UrlFetchApp.fetch(KEDRIX_VAT_LOOKUP_CONFIG.viesUrl, {
    method: 'post',
    contentType: 'text/xml; charset=utf-8',
    payload: payload,
    muteHttpExceptions: true
  });
  const code = response.getResponseCode();
  const text = response.getContentText();
  if (code >= 400) throw new Error('VIES HTTP ' + code);

  const document = XmlService.parse(text);
  const root = document.getRootElement();
  const soapNs = XmlService.getNamespace('http://schemas.xmlsoap.org/soap/envelope/');
  const body = root.getChild('Body', soapNs);
  if (!body) throw new Error('VIES response body missing');

  const fault = body.getChild('Fault', soapNs);
  if (fault) {
    const faultString = fault.getChildText('faultstring') || 'Unknown SOAP fault';
    throw new Error(faultString);
  }

  const responseNode = findNodeByName_(body, 'checkVatResponse');
  if (!responseNode) throw new Error('checkVatResponse missing');

  return {
    countryCode: getChildTextByName_(responseNode, 'countryCode'),
    vatNumber: getChildTextByName_(responseNode, 'vatNumber'),
    requestDate: getChildTextByName_(responseNode, 'requestDate'),
    valid: /^true$/i.test(getChildTextByName_(responseNode, 'valid')),
    name: cleanSoapText_(getChildTextByName_(responseNode, 'name')),
    address: cleanSoapText_(getChildTextByName_(responseNode, 'address'))
  };
}

function parseAddress_(rawAddress, country) {
  const cleaned = String(rawAddress || '').replace(//g, '
').replace(/
+/g, '
').trim();
  if (!cleaned) return { address: '', zipCode: '', city: '', province: '', country: country };
  const parts = cleaned.split('
').map(function(line) { return String(line || '').trim(); }).filter(Boolean);
  const firstLine = parts[0] || cleaned;
  const lastLine = parts.length > 1 ? parts[parts.length - 1] : '';
  const parsed = { address: firstLine, zipCode: '', city: '', province: '', country: country };
  let match = lastLine.match(/^(\d{5})\s+(.+?)\s*\(([A-Z]{2})\)$/);
  if (match) {
    parsed.zipCode = match[1];
    parsed.city = match[2];
    parsed.province = match[3];
    return parsed;
  }
  match = lastLine.match(/^(\d{5})\s+(.+)$/);
  if (match) {
    parsed.zipCode = match[1];
    parsed.city = match[2];
  }
  return parsed;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function getChildTextByName_(element, localName) {
  const child = findNodeByName_(element, localName);
  return child ? child.getText() : '';
}

function findNodeByName_(element, localName) {
  const children = element.getChildren();
  for (var i = 0; i < children.length; i += 1) {
    if (children[i].getName() === localName) return children[i];
  }
  return null;
}

function cleanSoapText_(value) {
  return String(value || '')
    .replace(/---/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function xmlEscape_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
