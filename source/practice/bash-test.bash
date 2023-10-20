set -e

f() {
  mv *.txt ./tmp
  echo "success"
}

f || echo "failed"