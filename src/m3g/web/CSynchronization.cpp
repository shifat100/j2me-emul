#include "CSynchronization.hpp"

CSynchronization *CSynchronization::InstanceL()
{
    static CSynchronization self;
    return &self;
}

CSynchronization::CSynchronization() : iErrorCode(0) {}
CSynchronization::~CSynchronization() {}
void CSynchronization::Lock() { iErrorCode = 0; }
void CSynchronization::Unlock() { iErrorCode = 0; }
void CSynchronization::SetErrorCode(int aCode) { if (iErrorCode == 0) iErrorCode = aCode; }
int CSynchronization::GetErrorCode() { return iErrorCode; }
