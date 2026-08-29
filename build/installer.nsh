; Custom NSIS include for Mixamo GLB Combiner
; - Shows finish page with "Run App" option
; - Registers .glb file association
; - Adds uninstall registry entry

!macro customInstall
  ; Write the uninstall registry keys
  WriteRegStr HKCU "Software\Mixamo GLB Combiner" "" $INSTDIR
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_FILENAME}" "DisplayName" "${PRODUCT_FILENAME}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_FILENAME}" "UninstallString" "$\"$INSTDIR\Uninstall ${PRODUCT_FILENAME}.exe$\""
!macroend

!macro customUnInstall
  ; Remove uninstall registry keys
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_FILENAME}"
  DeleteRegKey HKCU "Software\Mixamo GLB Combiner"
!macroend
