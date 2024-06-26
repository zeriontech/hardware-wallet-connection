import type {
  TypedDataDomain,
  TypedDataField,
} from "@ethersproject/abstract-signer";
import { hexlify, toUtf8Bytes, isHexString, TypedDataEncoder } from "ethers";
import omit from "lodash/omit";
import { connectDevice } from "../device/connectDevice";
import { decodeMessageSign } from "../device/utils/decodeMessageSign";

export async function personalSign(derivationPath: string, message: string) {
  const { appEth } = await connectDevice();
  const messageHex = isHexString(message)
    ? hexlify(message)
    : hexlify(toUtf8Bytes(message));
  const result = await appEth.signPersonalMessage(
    derivationPath,
    messageHex.slice(2), // Ledger expects hex value without 0x prefix
  );
  return decodeMessageSign(result);
}

export interface TypedData {
  domain: TypedDataDomain;
  types: Record<string, Array<TypedDataField>>;
  message: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  primaryType: string;
}

function prepareTypeData(rawTypedData: string | TypedData): TypedData {
  if (typeof rawTypedData === "string") {
    try {
      const typedData = JSON.parse(rawTypedData) as TypedData;
      if (
        !typedData.domain.chainId ||
        typedData.domain.chainId.toString().toLowerCase() === "nan"
      ) {
        typedData.domain.chainId = "0x1";
      }
      return typedData as TypedData;
    } catch (e) {
      throw new Error("Failed to parse typedData input");
    }
  }
  return rawTypedData;
}

const ESCAPE_ARRAY_SYMBOLS_PATTERN = /^([^\x5b]*)(\x5b|$)/;
const DOMAIN_TYPE = "EIP712Domain";
const DOMAIN_TYPES = {
  name: "string",
  version: "string",
  chainId: "uint256",
  verifyingContract: "address",
  salt: "bytes32",
};

function generateDomainTypes(domain: TypedDataDomain) {
  return {
    [DOMAIN_TYPE]: Object.keys(domain).map(name => ({
      name,
      type: DOMAIN_TYPES[name as keyof typeof DOMAIN_TYPES],
    })),
  };
}

function removeUnusedTypes(
  types: TypedData["types"],
  primaryType: TypedData["primaryType"],
): TypedData["types"] {
  const parents = new Map<string, string[]>(
    Object.keys(types).map(key => [key, []]),
  );
  for (const name in types) {
    for (const field of types[name]) {
      const baseType =
        field.type.match(ESCAPE_ARRAY_SYMBOLS_PATTERN)?.[1] || null;
      if (baseType) {
        parents.get(baseType)?.push(name);
      }
    }
  }
  const unusedTypes = Array.from(parents.keys()).filter(
    type => parents.get(type)?.length === 0 && type !== primaryType,
  );
  return omit(types, unusedTypes);
}

export async function signTypedData_v4(
  derivationPath: string,
  rawTypedData: string | TypedData,
) {
  const { appEth } = await connectDevice();
  const {
    domain,
    message,
    types: rawTypes,
    primaryType,
  } = prepareTypeData(rawTypedData);
  const types = removeUnusedTypes(rawTypes, primaryType);
  const domainTypes = rawTypes[DOMAIN_TYPE]
    ? { [DOMAIN_TYPE]: rawTypes[DOMAIN_TYPE] }
    : generateDomainTypes(domain);

  const domainSeparator = TypedDataEncoder.hashStruct(
    DOMAIN_TYPE,
    domainTypes,
    domain,
  );
  const hashStructMessage = TypedDataEncoder.hashStruct(
    primaryType,
    types,
    message,
  );
  const result = await appEth.signEIP712HashedMessage(
    derivationPath,
    hexlify(domainSeparator).slice(2),
    hexlify(hashStructMessage).slice(2),
  );
  return decodeMessageSign(result);
}
