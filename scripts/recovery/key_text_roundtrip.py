"""Prepare a private text copy of a 32-byte backup key without printing it.

Run locally beside the original encrypted backup. The text file is sensitive;
copy it into the owner's chosen password manager and remove the temporary file.
This utility does not upload, rotate or delete the binary key or backup.
"""

import argparse
import os
from pathlib import Path


def encode_key(binary_key: bytes) -> str:
    if len(binary_key) != 32:
        raise ValueError("Backup key must be exactly 32 bytes")
    text = binary_key.hex()
    if bytes.fromhex(text) != binary_key:
        raise ValueError("Key round-trip validation failed")
    return text


def write_private_text(binary_path: Path, text_path: Path) -> None:
    key = binary_path.read_bytes()
    encoded = encode_key(key)
    # Exclusive creation refuses a silent overwrite of any existing key file.
    fd = os.open(text_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        with os.fdopen(fd, "w", encoding="ascii", newline="\n") as output:
            output.write(encoded + "\n")
        restored = bytes.fromhex(text_path.read_text(encoding="ascii").strip())
        if restored != key:
            raise ValueError("Written key round-trip validation failed")
    except BaseException:
        text_path.unlink(missing_ok=True)
        raise


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--binary-key", type=Path, required=True)
    parser.add_argument("--text-output", type=Path, required=True)
    args = parser.parse_args()
    write_private_text(args.binary_key, args.text_output)
    print("Private text copy written; 32-byte round trip verified. No key material printed.")


if __name__ == "__main__":
    main()
