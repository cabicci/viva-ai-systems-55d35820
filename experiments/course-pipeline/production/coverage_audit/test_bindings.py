import unittest
from worker import validate_items,validate_matches

class EvidenceBindingTests(unittest.TestCase):
 def test_reject_source_quote_from_wrong_page(self):
  with self.assertRaises(AssertionError):
   validate_items([{'page':4,'kind':'procedure','requirementEN':'Take a representative sample','quote':'Mix the subsamples thoroughly.'}],{4:'Label the sample bag.',5:'Mix the subsamples thoroughly.'},4,5)
 def test_reject_fabricated_evidence_location(self):
  rows=[{'itemId':'A','status':'covered','evidence':[{'fieldId':'invented','quote':'Mix the subsamples thoroughly.'}]}]
  with self.assertRaises(AssertionError):validate_matches(rows,[{'itemId':'A'}],{})
 def test_reject_heading_only_full_coverage_without_evidence(self):
  with self.assertRaises(AssertionError):validate_matches([{'itemId':'A','status':'covered','evidence':[]}],[{'itemId':'A'}],{})
 def test_reject_quote_from_different_field(self):
  fields={'real':{'step':'S1','path':'/scenes/0/explanation','role':'written','text':'Label the sample bag.'}}
  with self.assertRaises(AssertionError):validate_matches([{'itemId':'A','status':'covered','evidence':[{'fieldId':'real','quote':'Mix the subsamples thoroughly.'}]}],[{'itemId':'A'}],fields)
 def test_accept_literal_pdf_spacing_without_accepting_paraphrase(self):
  items=validate_items([{'page':4,'kind':'concept','requirementEN':'Sampling','quote':'Representative sampling is necessary.'}],{4:'R e p r e s e n t a t i v e sampling is necessary.'},4,4)
  self.assertEqual(len(items),1)
if __name__=='__main__':unittest.main()
